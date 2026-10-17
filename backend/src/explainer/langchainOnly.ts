import { ChatAnthropic } from "@langchain/anthropic";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { config } from "../config";

export interface LangChainOnlyResult {
  answer: string;
}

/**
 * The deliberate counterpart to `buildAndRun.ts`'s `explainApp`: one plain
 * LangChain chain (`PromptTemplate.pipe(model).pipe(outputParser)`), no
 * `StateGraph`, no retrieval, no second model call. Exists so the
 * LangGraph page can show a real, separately-running LangChain-only example
 * next to the LangGraph one instead of just asserting in prose that they're
 * different tools (see info/personalized-explainer-spec.md's follow-up
 * note on that confusion).
 */
export async function explainTermWithLangChain(term: string): Promise<LangChainOnlyResult> {
  const model = new ChatAnthropic({ apiKey: config.anthropicApiKey, model: config.anthropicModel });
  // Same fix as buildAndRun.ts: @langchain/anthropic only knows to omit
  // top_p for a hardcoded list of older model names, so it otherwise sends
  // an invalid -1 sentinel Claude's API now rejects outright for this model.
  (model as unknown as { topP?: number }).topP = undefined;

  const prompt = PromptTemplate.fromTemplate(
    `Explain the following term in plain, direct language, in two or three sentences, for ` +
      `someone reading an AI engineering tutorial for the first time. Define it from scratch; ` +
      `don't assume the reader already knows what it means. If it's genuinely ambiguous which ` +
      `meaning is intended, pick the one most relevant to building applications around language ` +
      `models.\n\nTerm: {term}`
  );

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  const answer = await chain.invoke({ term });

  return { answer };
}
