"use client";

import { useState, type FormEvent } from "react";
import { explainTermWithLangChain } from "@/lib/api";

const SAMPLE_TERMS = ["Embedding", "Context window", "Hallucination", "System prompt"];

/**
 * The deliberate counterpart to AppExplainer: a single LangChain call
 * (`PromptTemplate.pipe(model).pipe(outputParser)`, see
 * backend/src/explainer/langchainOnly.ts), no retrieval, no graph, no
 * second model call. Kept visually distinct (sky accent, "one call" badge,
 * plain text answer only, no diagram) specifically so it doesn't read as a
 * smaller version of AppExplainer's LangGraph demo just below it.
 */
export function LangChainDemo() {
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);

  async function run(overrideTerm?: string) {
    const finalTerm = overrideTerm ?? term;
    if (!finalTerm.trim() || loading) return;
    if (overrideTerm) setTerm(overrideTerm);

    setLoading(true);
    setError(null);
    setAnswer(null);

    try {
      const result = await explainTermWithLangChain(finalTerm);
      setAnswer(result.answer);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    run();
  }

  return (
    <div className="card space-y-4 border-l-[3px] !border-l-sky-700/50">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-paper-ink/50">
          LangChain only
        </h3>
        <span className="pill border-sky-700/30 bg-sky-700/[0.06] text-sky-800">one direct call</span>
      </div>
      <p className="text-sm text-paper-ink/60">
        This box does the simplest thing possible: it takes the word you type below, drops it
        into a ready-made question like &ldquo;explain this term in a couple sentences,&rdquo;
        sends that straight to Claude, and shows you whatever Claude writes back. One request,
        one reply, nothing else happens in between. No searching anything first, no multiple
        steps, no second AI call.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          className="input"
          placeholder="A term to define, e.g. 'tokenization'…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={loading || !term.trim()}>
          Explain
        </button>
      </form>

      <div>
        <p className="font-display text-xs font-bold uppercase tracking-wide text-paper-ink/40">
          Or try one of these
        </p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {SAMPLE_TERMS.map((t) => (
            <li key={t}>
              <button
                type="button"
                onClick={() => run(t)}
                disabled={loading}
                className="pill cursor-pointer text-paper-ink/70 transition hover:border-sky-700/40 hover:text-sky-800 disabled:pointer-events-none disabled:opacity-50"
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {loading && (
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-paper-ink/15 border-t-sky-700"
          />
          <p className="text-sm italic text-paper-ink/40">Running the chain…</p>
        </div>
      )}
      {error && <p className="text-sm text-red-600">Error: {error}</p>}

      {answer && (
        <div className="border-l-[3px] border-sky-700/50 bg-sky-700/[0.04] py-3 pl-5 pr-4">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-sky-800">
            Answer
          </p>
          <p className="mt-2 whitespace-pre-wrap text-[15.5px]">{answer}</p>
        </div>
      )}
    </div>
  );
}
