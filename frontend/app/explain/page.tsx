import Link from "next/link";
import { AppExplainer } from "@/components/AppExplainer";

/**
 * The bare, no-textbook-chrome entry point for someone who wants this app
 * explained to them directly, without first having to know what "Chapter
 * 11" or "LangGraph" mean. See info/personalized-explainer-spec.md section
 * 2 for why this exists as its own page rather than just being folded into
 * Chapter 11: a first-time, possibly confused visitor shouldn't be handed a
 * second unfamiliar concept while asking to have the first one explained.
 */
export default function ExplainPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-black tracking-tight text-paper-ink sm:text-4xl">
          Ask, and see how this app actually works
        </h1>
        <p className="mx-auto max-w-lg text-base italic leading-relaxed text-paper-ink/70">
          Type a real question about anything in AI Nexus. You'll get back a diagram and an
          explanation built specifically to answer it, not a fixed page everyone sees the same
          way.
        </p>
      </div>

      <div className="text-left">
        <AppExplainer />
      </div>

      <Link
        href="/"
        className="inline-block text-sm text-paper-ink/60 underline decoration-paper-ink/25 underline-offset-4 transition hover:text-brand-700 hover:decoration-brand-500"
      >
        Want to see everything else this app can do? Back to the table of contents
      </Link>
    </div>
  );
}
