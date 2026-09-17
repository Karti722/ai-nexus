"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import mermaid from "mermaid";
import { explainApp } from "@/lib/api";

mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });

const SAMPLE_QUESTIONS = [
  "How does the RAG chapter retrieve information for an answer?",
  "What happens when the AI agent decides to use a tool?",
  "How does the Model Context Protocol let the agent reach the weather tool?",
  "How is this app actually deployed?",
];

/**
 * The one real implementation behind both the Chapter 11 textbook page and
 * the bare `/explain` page (see info/personalized-explainer-spec.md section
 * 2): a question goes to a real LangGraph workflow that retrieves from the
 * same knowledge base Chapter 3's RAG uses, then generates a Mermaid
 * diagram definition and a written explanation grounded in what it actually
 * retrieved. Mermaid.js, not the model, controls the diagram's layout, the
 * model only ever produces text describing which boxes exist and how they
 * connect (see the spec's section 4 for why: an LLM outputting raw diagram
 * coordinates is unreliable, generating structured text for a deterministic
 * renderer is the same pattern Claude and ChatGPT themselves use when asked
 * to draw something).
 */
export function AppExplainer() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [diagramSvg, setDiagramSvg] = useState<string | null>(null);
  const [diagramCaption, setDiagramCaption] = useState<string | null>(null);
  const [diagramError, setDiagramError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const rawId = useId();
  const diagramId = `explainer-diagram-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    setSpeechSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stopSpeaking() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  }

  function handleListen() {
    if (!explanation || !speechSupported) return;
    if (speaking) {
      stopSpeaking();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(explanation);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  async function handleGenerate(eOrPrompt?: FormEvent | string) {
    const overridePrompt = typeof eOrPrompt === "string" ? eOrPrompt : undefined;
    if (typeof eOrPrompt !== "string") eOrPrompt?.preventDefault();

    const finalQuestion = overridePrompt ?? question;
    if (!finalQuestion.trim() || loading) return;
    if (overridePrompt) setQuestion(overridePrompt);

    setLoading(true);
    setError(null);
    setExplanation(null);
    setDiagramSvg(null);
    setDiagramCaption(null);
    setDiagramError(null);
    stopSpeaking();

    try {
      const result = await explainApp(finalQuestion);
      setExplanation(result.explanation);
      setDiagramCaption(result.diagramCaption || null);

      const parsed = await mermaid.parse(result.mermaidDefinition, { suppressErrors: true });
      if (!parsed) {
        setDiagramError(
          "Couldn't render a diagram for this one, but the explanation below is still real and grounded in the same answer."
        );
      } else {
        const { svg } = await mermaid.render(diagramId, result.mermaidDefinition);
        setDiagramSvg(svg);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4">
      <form onSubmit={handleGenerate} className="flex flex-col gap-2 sm:flex-row">
        <input
          className="input"
          placeholder="Ask anything about how this app works…"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={loading || !question.trim()}>
          Generate
        </button>
      </form>

      <div>
        <p className="font-display text-xs font-bold uppercase tracking-wide text-paper-ink/40">
          Not sure what to ask? Try one of these
        </p>
        <ol className="mt-2 space-y-1.5 text-sm">
          {SAMPLE_QUESTIONS.map((q, i) => (
            <li key={q}>
              <button
                type="button"
                onClick={() => handleGenerate(q)}
                disabled={loading}
                title={q}
                className="text-left leading-relaxed text-paper-ink/70 underline decoration-paper-ink/25 decoration-dotted underline-offset-4 transition hover:text-brand-700 hover:decoration-brand-500 disabled:pointer-events-none disabled:opacity-50"
              >
                {i + 1}. {q}
              </button>
            </li>
          ))}
        </ol>
      </div>

      {loading && <p className="text-sm italic text-paper-ink/40">Searching the real knowledge base and drawing…</p>}
      {error && <p className="text-sm text-red-600">Error: {error}</p>}

      {(diagramSvg || diagramError) && (
        <div className="space-y-2">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Diagram</p>
          <p className="text-sm text-paper-ink/60">
            {diagramCaption ||
              "A visual walkthrough of the answer to your specific question, generated fresh, not a fixed illustration everyone sees."}
          </p>
          <div className="overflow-x-auto rounded-sm border border-paper-ink/15 bg-white p-4">
            {diagramSvg ? (
              <div dangerouslySetInnerHTML={{ __html: diagramSvg }} />
            ) : (
              <p className="text-sm italic text-paper-ink/50">{diagramError}</p>
            )}
          </div>
        </div>
      )}

      {explanation && (
        <div className="border-l-[3px] border-brand-500/50 bg-brand-500/[0.04] py-3 pl-5 pr-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-700">
              Explanation
            </p>
            {speechSupported && (
              <button
                type="button"
                onClick={handleListen}
                className="shrink-0 text-xs font-medium text-paper-ink/60 underline decoration-paper-ink/25 underline-offset-4 transition hover:text-brand-700 hover:decoration-brand-500"
              >
                {speaking ? "Stop" : "Listen"}
              </button>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap text-[15.5px]">{explanation}</p>
        </div>
      )}
    </div>
  );
}
