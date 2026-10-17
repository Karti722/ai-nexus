interface ExplainIconProps {
  className?: string;
}

/**
 * A speech-bubble-with-a-spark icon for the "Generate a personalized
 * explanation" card, deliberately drawn in the same hand-drawn, inline-SVG
 * language as BookIcon/HomeIllustration: white fill, paper-ink strokes, and
 * the same brand-purple spark marking "AI-generated" that rises from the
 * open book. Without it, that card was plain text next to an illustrated
 * one; with it, the homepage's two "start" cards read as a matched pair.
 */
export function ExplainIcon({ className = "h-20 w-auto sm:h-24" }: ExplainIconProps = {}) {
  return (
    <svg viewBox="0 0 160 124" className={className} aria-hidden>
      {/* bubble, with a tail pointing down-left like a real speech bubble */}
      <path
        d="M14 14 H146 a10 10 0 0 1 10 10 V86 a10 10 0 0 1 -10 10 H64 L40 116 V96 H14 a10 10 0 0 1 -10 -10 V24 a10 10 0 0 1 10 -10 Z"
        className="fill-white stroke-paper-ink/35"
        strokeWidth="2"
      />
      {/* text lines inside, echoing the open book's page lines */}
      <path d="M28 40 H132" className="stroke-paper-ink/25" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M28 56 H118" className="stroke-paper-ink/25" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M28 72 H98" className="stroke-paper-ink/20" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* the same spark motif as the book, marking this as AI-generated too */}
      <path d="M134 10 L137 17 L144 19 L137 21 L134 28 L131 21 L124 19 L131 17 Z" className="fill-brand-500" />
      <circle cx="134" cy="1" r="2.2" className="fill-brand-400" opacity="0.8" />
    </svg>
  );
}
