/**
 * Next.js shows this automatically during the route transition into
 * /explain, while its JS bundle (which includes the Mermaid library, the
 * heaviest single dependency in this app) downloads and initializes. No
 * manual loading state needed: the App Router wraps every route segment in
 * a Suspense boundary and renders this file as the fallback until the real
 * page component is ready.
 */
export default function ExplainLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-16 text-center">
      <div
        className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-paper-ink/15 border-t-brand-600"
        aria-hidden
      />
      <p className="font-display text-sm text-paper-ink/60">
        Loading the explainer, one moment, don't click anything yet.
      </p>
    </div>
  );
}
