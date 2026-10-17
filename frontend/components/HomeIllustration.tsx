interface HomeIllustrationProps {
  className?: string;
  /** True when reused somewhere the surrounding content (e.g. the nav bar's
   * "AI Nexus" text) already names it, so the icon itself shouldn't also
   * announce itself to assistive tech and end up read twice. */
  decorative?: boolean;
}

/**
 * A small, hand-drawn open-book illustration for the homepage, matching the
 * site's printed-textbook identity (paper tones, brand accent) rather than a
 * generic tech/AI graphic. Pure inline SVG: no external image, no network
 * request, scales cleanly at any size, styled with the same Tailwind color
 * tokens (paper-ink, brand) as the rest of the app rather than hardcoded hex.
 * Also reused, smaller, as the nav bar's open-book state (see NavBar.tsx).
 */
export function HomeIllustration({
  className = "mx-auto h-20 w-auto sm:h-24",
  decorative = false,
}: HomeIllustrationProps = {}) {
  return (
    <svg
      viewBox="0 0 220 120"
      className={className}
      {...(decorative
        ? { "aria-hidden": true }
        : {
            role: "img",
            "aria-label": "An open book, with a small glowing spark rising from its pages",
          })}
    >
      {/* left page */}
      <path
        d="M14 22 C 55 10, 85 10, 108 24 L 108 100 C 85 86, 55 86, 14 98 Z"
        className="fill-white stroke-paper-ink/35"
        strokeWidth="1.5"
      />
      {/* right page */}
      <path
        d="M206 22 C 165 10, 135 10, 112 24 L 112 100 C 135 86, 165 86, 206 98 Z"
        className="fill-white stroke-paper-ink/35"
        strokeWidth="1.5"
      />
      {/* spine shadow */}
      <path d="M108 24 L 112 24 L 112 100 L 108 100 Z" className="fill-paper-ink/[0.08]" />

      {/* left page lines */}
      <path d="M26 36 C 55 28, 78 28, 98 38" className="stroke-paper-ink/25" strokeWidth="2" fill="none" />
      <path d="M26 48 C 55 40, 78 40, 98 50" className="stroke-paper-ink/25" strokeWidth="2" fill="none" />
      <path d="M26 60 C 50 53, 70 53, 90 62" className="stroke-paper-ink/20" strokeWidth="2" fill="none" />

      {/* right page lines */}
      <path d="M194 36 C 165 28, 142 28, 122 38" className="stroke-paper-ink/25" strokeWidth="2" fill="none" />
      <path d="M194 48 C 165 40, 142 40, 122 50" className="stroke-paper-ink/25" strokeWidth="2" fill="none" />
      <path d="M194 60 C 170 53, 150 53, 130 62" className="stroke-paper-ink/20" strokeWidth="2" fill="none" />

      {/* a small spark rising from the book: the "AI" welcoming touch, understated */}
      <path
        d="M110 14 L113 21 L120 23 L113 25 L110 32 L107 25 L100 23 L107 21 Z"
        className="fill-brand-500"
      />
      <circle cx="110" cy="4" r="2.2" className="fill-brand-400" opacity="0.8" />
    </svg>
  );
}
