import type { NodeType } from "./types";

export interface NodeCatalogEntry {
  type: NodeType;
  label: string;
  description: string;
  /** "control" nodes (start/end) are placed once; "reasoning" decides where
   * to go next dynamically; "tool" nodes always have exactly one outgoing
   * edge, since a tool doesn't make decisions, it just does the one thing
   * it does and hands control back. The frontend uses this to decide how
   * many outgoing edges a node is allowed to have. */
  category: "control" | "reasoning" | "tool";
}

/** Static metadata the frontend fetches to populate the node palette. Kept
 * on the backend, not hardcoded in the frontend, so the two can never drift
 * out of sync about which node types actually exist and what they do. */
export const NODE_CATALOG: NodeCatalogEntry[] = [
  {
    type: "start",
    label: "Start",
    description: "Where the user's question enters the graph. Every graph needs exactly one.",
    category: "control",
  },
  {
    type: "end",
    label: "End",
    description: "Where a final answer leaves the graph. Only reachable from a Reasoning node you connect it to.",
    category: "control",
  },
  {
    type: "reasoning",
    label: "Reasoning (Claude)",
    description:
      "Asks Claude what to do next, but only from among the nodes you've actually connected to this one. " +
      "The graph you draw is the only thing that decides what's possible here.",
    category: "reasoning",
  },
  {
    type: "tool_calculator",
    label: "Calculator",
    description: "The same hand-written arithmetic evaluator used by the Chapter 4 agent.",
    category: "tool",
  },
  {
    type: "tool_knowledge_base",
    label: "Search Knowledge Base",
    description: "Real RAG retrieval against the same pgvector-backed knowledge base as Chapter 3.",
    category: "tool",
  },
  {
    type: "tool_weather",
    label: "Get Weather",
    description: "The same real WeatherAPI.com call, made through the same custom MCP server, as Chapter 4.",
    category: "tool",
  },
  {
    type: "tool_current_time",
    label: "Get Current Time",
    description: "Another real MCP tool: returns the current time.",
    category: "tool",
  },
];
