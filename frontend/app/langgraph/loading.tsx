/** Same reason as app/explain/loading.tsx: this page also loads the
 * Mermaid-dependent AppExplainer component, and Next.js shows this
 * automatically during that route transition. */
export default function LangGraphLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-16 text-center">
      <div
        className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-paper-ink/15 border-t-brand-600"
        aria-hidden
      />
      <p className="font-display text-sm text-paper-ink/60">
        Loading the chapter, one moment, don't click anything yet.
      </p>
    </div>
  );
}
