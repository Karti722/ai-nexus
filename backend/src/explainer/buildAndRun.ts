import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { embedTexts } from "../rag/embeddingsClient";
import { searchSimilar } from "../rag/vectorStore";
import { config } from "../config";

export interface ExplainResult {
  mermaidDefinition: string;
  diagramCaption: string;
  explanation: string;
}

const ExplainerState = Annotation.Root({
  question: Annotation<string>(),
  context: Annotation<string[]>({ reducer: (a, b) => a.concat(b), default: () => [] }),
  mermaidDefinition: Annotation<string>({ reducer: (_prev, next) => next, default: () => "" }),
  diagramCaption: Annotation<string>({ reducer: (_prev, next) => next, default: () => "" }),
  explanation: Annotation<string>({ reducer: (_prev, next) => next, default: () => "" }),
});

type State = typeof ExplainerState.State;

/**
 * Splits the diagram node's response into a one-sentence caption describing
 * what *this specific* diagram shows and the Mermaid definition itself,
 * expected in `CAPTION: ...` / `DIAGRAM: ...` sections (see the system
 * prompt below). A generic, hardcoded caption was tried first and rejected:
 * it described the feature's mechanism in general, not what any particular
 * diagram actually depicts, which isn't the same thing a reader needs.
 * Falls back to no caption, not an error, if the model doesn't follow the
 * format exactly, since a missing caption is a minor loss, not a broken
 * page, and the diagram/explanation are still real either way.
 */
function extractCaptionAndMermaid(raw: string): { caption: string; mermaidDefinition: string } {
  const captionMatch = raw.match(/CAPTION:\s*(.+?)(?:\n|$)/i);
  const caption = captionMatch ? captionMatch[1].trim() : "";

  const afterDiagramMarker = raw.split(/DIAGRAM:/i)[1] ?? raw;
  const fenced = afterDiagramMarker.match(/```(?:mermaid)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : afterDiagramMarker;
  const lines = body
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l, i, arr) => l.trim().length > 0 || i < arr.length - 1);

  const startIndex = lines.findIndex((l) => /^\s*(flowchart|graph|sequenceDiagram)\b/.test(l));
  const mermaidDefinition = (startIndex >= 0 ? lines.slice(startIndex) : lines).join("\n").trim();

  return { caption, mermaidDefinition };
}

/**
 * The Chapter 11 / `/explain` feature: answers a plain-language question
 * about how this app actually works with a real Mermaid diagram plus a
 * written explanation, both grounded in the same knowledge base Chapter 3's
 * RAG and Chapter 4's agent already search (see
 * info/personalized-explainer-spec.md section 4 for why: retrieval first,
 * generation second, so the diagram can't describe a service or a data flow
 * that doesn't actually exist). Three fixed steps, not a user-configurable
 * graph like the earlier, removed agent-graph prototype, so unlike that one,
 * every node name here is a compile-time string literal and needs none of
 * the `any`-casting that dynamic graph required.
 */
export async function explainApp(question: string): Promise<ExplainResult> {
  // topP forced to undefined here for the same reason as the removed
  // agent-graph prototype: @langchain/anthropic only knows to omit top_p for
  // a hardcoded list of older model names that predates claude-sonnet-5, so
  // it otherwise sends an invalid -1 sentinel Claude's API now rejects
  // outright for this model. Found live before, not a hypothetical here.
  const model = new ChatAnthropic({ apiKey: config.anthropicApiKey, model: config.anthropicModel });
  (model as unknown as { topP?: number }).topP = undefined;

  const workflow = new StateGraph(ExplainerState)
    .addNode("retrieve", async (state: State) => {
      const [embedding] = await embedTexts([state.question], "query");
      const results = await searchSimilar(embedding, 5);
      const context = results.map(
        (r) => `[${r.source}] (similarity ${r.score.toFixed(2)}): ${r.text}`
      );
      return { context };
    })
    .addNode("diagram", async (state: State) => {
      const system = new SystemMessage(
        `You explain how a real software system works by producing a single Mermaid diagram, ` +
          `plus a one-sentence caption describing what that specific diagram shows. Respond in ` +
          `exactly this format and nothing else, no markdown code fences around the whole thing, ` +
          `no preamble:\n\n` +
          `CAPTION: <one plain sentence describing what this specific diagram depicts, written ` +
          `for someone about to look at it, not a generic description of diagrams in general>\n` +
          `DIAGRAM:\n<a valid Mermaid diagram definition, starting with "flowchart TD", ` +
          `"flowchart LR", or "sequenceDiagram">\n\n` +
          `Base both strictly on the real context passages provided; if the context doesn't fully ` +
          `cover the question, still produce the best, most relevant diagram and caption you ` +
          `honestly can from what's actually there, don't invent services, files, or steps that ` +
          `aren't in the context.`
      );
      const human = new HumanMessage(
        `Question: ${state.question}\n\nReal context passages about this app:\n\n${state.context.join(
          "\n\n"
        )}`
      );
      const response = await model.invoke([system, human]);
      const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      const { caption, mermaidDefinition } = extractCaptionAndMermaid(text);
      return { mermaidDefinition, diagramCaption: caption };
    })
    .addNode("explain", async (state: State) => {
      const system = new SystemMessage(
        `You explain how a real software system works in plain, direct language, grounded ` +
          `strictly in the context passages provided. A Mermaid diagram illustrating the same ` +
          `answer already exists; your job is the written explanation that accompanies it, not ` +
          `a description of the diagram itself. Keep it to two or three short paragraphs. Don't ` +
          `invent details the context doesn't support.`
      );
      const human = new HumanMessage(
        `Question: ${state.question}\n\nReal context passages about this app:\n\n${state.context.join(
          "\n\n"
        )}`
      );
      const response = await model.invoke([system, human]);
      const text = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
      return { explanation: text };
    })
    .addEdge(START, "retrieve")
    .addEdge("retrieve", "diagram")
    .addEdge("diagram", "explain")
    .addEdge("explain", END);

  const compiled = workflow.compile();
  const result = await compiled.invoke({ question });

  return {
    mermaidDefinition: result.mermaidDefinition,
    diagramCaption: result.diagramCaption,
    explanation: result.explanation,
  };
}
