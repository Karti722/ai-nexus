import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { getMcpTools, callMcpTool } from "../agent/mcpClient";
import { LOCAL_TOOLS } from "../agent/tools";
import { config } from "../config";
import type { GraphTraceStep, NodeType, RunGraphResult, UserGraph, UserGraphNode } from "./types";

/** Same ceiling as agent/agentLoop.ts's MAX_STEPS, for the same reason: a
 * user-built graph can contain a cycle (intentionally, e.g. tool -> reasoning
 * -> tool, or by mistake), so every node's routing is checked against this
 * regardless of what the node itself decided, not just reasoning nodes. */
const MAX_STEPS = 12;

const TOOL_NAME_BY_TYPE: Partial<Record<NodeType, string>> = {
  tool_calculator: "calculator",
  tool_knowledge_base: "search_knowledge_base",
  tool_weather: "get_weather",
  tool_current_time: "get_current_time",
};

const GraphState = Annotation.Root({
  query: Annotation<string>(),
  context: Annotation<string[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  finalAnswer: Annotation<string | null>({ reducer: (_prev, next) => next, default: () => null }),
  trace: Annotation<GraphTraceStep[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  steps: Annotation<number>({ reducer: (a, b) => a + b, default: () => 0 }),
  /** Set by a reasoning node's own logic; read back by the conditional-edge
   * router registered for that same node right after. Not meaningful for
   * tool nodes, whose router ignores it in favor of their one fixed edge. */
  nextNodeId: Annotation<string>({ reducer: (_prev, next) => next, default: () => "" }),
  /** The input args Claude chose when calling a tool, e.g. the calculator's
   * expression or the knowledge base query, carried from the reasoning node
   * that decided to call a tool to the tool node that actually executes it. */
  pendingToolInput: Annotation<Record<string, unknown>>({ reducer: (_prev, next) => next, default: () => ({}) }),
});

type State = typeof GraphState.State;

/** LangGraph's own END/START are objects, not strings, so they can't be
 * used as keys in the string-keyed mapping addConditionalEdges expects.
 * Every router below returns one of these two string sentinels instead,
 * and the mapping passed to addConditionalEdges translates them (and every
 * real user node id) to the real destination. */
const END_SENTINEL = "__end__";

function validate(graph: UserGraph): void {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const starts = graph.nodes.filter((n) => n.type === "start");
  const ends = graph.nodes.filter((n) => n.type === "end");
  if (starts.length !== 1) throw new Error(`A graph needs exactly one Start node (found ${starts.length}).`);
  if (ends.length < 1) throw new Error("A graph needs at least one End node.");

  for (const edge of graph.edges) {
    if (!byId.has(edge.source)) throw new Error(`Edge references unknown source node "${edge.source}".`);
    if (!byId.has(edge.target)) throw new Error(`Edge references unknown target node "${edge.target}".`);
  }

  for (const node of graph.nodes) {
    const outgoing = graph.edges.filter((e) => e.source === node.id);
    if (node.type === "start" && outgoing.length !== 1) {
      throw new Error("The Start node must have exactly one outgoing connection.");
    }
    if (node.type.startsWith("tool_") && outgoing.length !== 1) {
      throw new Error(`Tool node "${node.id}" must have exactly one outgoing connection.`);
    }
    if (node.type === "reasoning" && outgoing.length < 1) {
      throw new Error(`Reasoning node "${node.id}" needs at least one outgoing connection to do anything.`);
    }
    if (node.type === "end" && outgoing.length !== 0) {
      throw new Error("The End node can't have outgoing connections.");
    }
  }
}

async function toolDefinitionFor(type: NodeType, mcpTools: Awaited<ReturnType<typeof getMcpTools>>) {
  if (type === "tool_calculator" || type === "tool_knowledge_base") {
    const name = TOOL_NAME_BY_TYPE[type];
    const local = LOCAL_TOOLS.find((t) => t.definition.name === name);
    if (!local) throw new Error(`Local tool "${name}" not found.`);
    return local.definition;
  }

  const name = TOOL_NAME_BY_TYPE[type];
  const mcpDef = mcpTools.find((t) => t.name === name);
  if (!mcpDef) {
    throw new Error(
      `MCP tool "${name}" is unavailable (is the MCP server built? run "npm run build --prefix mcp-server").`
    );
  }
  return mcpDef;
}

async function executeToolByType(type: NodeType, input: Record<string, unknown>): Promise<string> {
  const name = TOOL_NAME_BY_TYPE[type];
  if (!name) throw new Error(`"${type}" is not a tool node.`);

  const local = LOCAL_TOOLS.find((t) => t.definition.name === name);
  if (local) return local.execute(input);
  return callMcpTool(name, input);
}

function labelFor(type: NodeType): string {
  switch (type) {
    case "tool_calculator":
      return "the calculator";
    case "tool_knowledge_base":
      return "the knowledge base search";
    case "tool_weather":
      return "the weather tool";
    case "tool_current_time":
      return "the current-time tool";
    default:
      return type;
  }
}

/**
 * Compiles a user-drawn graph (from the Chapter 11 canvas) into a real
 * LangGraph StateGraph and runs it against a real question. Reasoning nodes
 * call Claude through @langchain/anthropic with only the tools reachable via
 * this specific node's own outgoing edges bound, the graph's shape is the
 * actual mechanism restricting what the model is allowed to do next, not
 * just a visualization drawn on top of a fixed agent loop. Tool nodes call
 * the exact same real tool implementations Chapter 4's hand-built agent
 * uses, no separate reimplementation to keep in sync.
 */
export async function runUserGraph(graph: UserGraph, query: string): Promise<RunGraphResult> {
  validate(graph);

  const byId = new Map<string, UserGraphNode>(graph.nodes.map((n) => [n.id, n]));
  const outgoingOf = (id: string) => graph.edges.filter((e) => e.source === id);
  const mcpTools = await getMcpTools();

  // @langchain/anthropic only knows to omit top_p entirely for a hardcoded
  // list of older model names (opus-4-1, sonnet-4-5, haiku-4-5); for any
  // other model, including claude-sonnet-5, it always sends a real value,
  // defaulting to an internal -1 sentinel when none is given. Claude's API
  // rejects -1 outright as invalid, and (found live, testing this exact
  // function) rejects top_p being present at all for this model, so the
  // fix isn't a valid value, it's forcing the property itself to
  // undefined, which the constructor's own option has no path to for a
  // model outside that hardcoded list.
  const model = new ChatAnthropic({
    apiKey: config.anthropicApiKey,
    model: config.anthropicModel,
  });
  (model as unknown as { topP?: number }).topP = undefined;

  // LangGraph's TS types assume every node name is a string literal known at
  // compile time, so `.addNode`/`.addEdge`/`.addConditionalEdges` can build a
  // precise literal-union type for valid node names. This graph's node names
  // come from user input at runtime, which that model can't express, hence
  // `any` here specifically: the runtime behavior (a node name is just a
  // string key) is unaffected, only the compile-time literal tracking is.
  const workflow = new StateGraph(GraphState) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  for (const node of graph.nodes) {
    if (node.type === "reasoning") {
      const edges = outgoingOf(node.id).map((e) => ({ target: e.target, targetType: byId.get(e.target)!.type }));
      const toolEdges = edges.filter((e) => e.targetType !== "end");
      const canFinishHere = edges.some((e) => e.targetType === "end");

      workflow.addNode(node.id, async (state: State) => {
        const toolDefs = await Promise.all(toolEdges.map((e) => toolDefinitionFor(e.targetType, mcpTools)));
        const bound = toolDefs.length > 0 ? model.bindTools(toolDefs) : model;

        const options = toolEdges.map((e) => `- ${labelFor(e.targetType)}`).join("\n");
        const system = new SystemMessage(
          `You are one reasoning step inside a graph the user built themselves. ` +
            `From here, you may ONLY do one of the following, nothing else exists as an option:\n${options}\n` +
            (canFinishHere
              ? `- Or, if you already have enough information, answer the question directly in plain text.`
              : `There is no "answer directly" option wired from this node; you must pick one of the tools above ` +
                `even if you think you already know the answer, that's what this part of the graph is for.`)
        );
        const human = new HumanMessage([query, ...state.context].join("\n\n"));

        const response = await bound.invoke([system, human]);

        if (response.tool_calls && response.tool_calls.length > 0) {
          const call = response.tool_calls[0];
          const edge = toolEdges.find((e) => TOOL_NAME_BY_TYPE[e.targetType] === call.name);
          if (!edge) {
            return {
              finalAnswer: `Model tried to call "${call.name}", which isn't wired from this node.`,
              nextNodeId: END_SENTINEL,
              steps: 1,
              trace: [{ nodeId: node.id, nodeType: node.type, summary: "Tried to use an unavailable tool." }],
            };
          }
          return {
            nextNodeId: edge.target,
            pendingToolInput: call.args as Record<string, unknown>,
            steps: 1,
            trace: [{ nodeId: node.id, nodeType: node.type, summary: `Decided to use ${labelFor(edge.targetType)}.` }],
          };
        }

        const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
        return {
          finalAnswer: text,
          nextNodeId: END_SENTINEL,
          steps: 1,
          trace: [{ nodeId: node.id, nodeType: node.type, summary: "Answered directly." }],
        };
      });

      const mapping: Record<string, typeof END | string> = { [END_SENTINEL]: END };
      for (const e of edges) {
        mapping[e.target] = e.targetType === "end" ? END : e.target;
      }
      workflow.addConditionalEdges(
        node.id,
        (state: State) => (state.steps >= MAX_STEPS ? END_SENTINEL : state.nextNodeId),
        mapping
      );
    } else if (node.type.startsWith("tool_")) {
      const [edge] = outgoingOf(node.id);
      const targetType = byId.get(edge.target)!.type;

      workflow.addNode(node.id, async (state: State) => {
        const output = await executeToolByType(node.type, state.pendingToolInput);
        return {
          context: [`[${labelFor(node.type)} result] ${output}`],
          steps: 1,
          trace: [{ nodeId: node.id, nodeType: node.type, summary: `Ran, result: ${output.slice(0, 200)}` }],
        };
      });

      workflow.addConditionalEdges(
        node.id,
        (state: State) => (state.steps >= MAX_STEPS ? END_SENTINEL : "fixed"),
        { [END_SENTINEL]: END, fixed: targetType === "end" ? END : edge.target }
      );
    }
  }

  const startNode = graph.nodes.find((n) => n.type === "start")!;
  const [startEdge] = outgoingOf(startNode.id);
  workflow.addEdge(START, startEdge.target);

  const compiled = workflow.compile();
  const result = (await compiled.invoke({ query }, { recursionLimit: MAX_STEPS + 5 })) as State;

  return {
    trace: result.trace,
    finalAnswer: result.finalAnswer ?? "The graph ended without producing an answer.",
  };
}
