interface BookIconProps {
  className?: string;
}

/**
 * A small, closed-book brand mark: a brown leather-style cover, spine and a
 * bookmark ribbon in the brand color, evoking a closed college textbook.
 * Used as the nav bar's home-page state (see NavBar.tsx), paired there with
 * HomeIllustration's open book to simulate opening the book on hover/click.
 * Deliberately simpler than HomeIllustration (no page-curve detail) since
 * this renders at a much smaller size where fine detail just turns to
 * visual noise. Pure inline SVG, no external image.
 */
export function BookIcon({ className = "h-6 w-auto" }: BookIconProps = {}) {
  return (
    <svg viewBox="0 0 28 30" className={className} aria-hidden>
      {/* cover */}
      <rect
        x="4"
        y="3"
        width="20"
        height="24"
        rx="1.5"
        className="fill-[#6b4428] stroke-[#432a18]"
        strokeWidth="1.5"
      />
      {/* spine */}
      <line x1="8.5" y1="3" x2="8.5" y2="27" className="stroke-[#432a18]/70" strokeWidth="1.2" />
      {/* title lines, embossed-gold look against the brown cover */}
      <line
        x1="13"
        y1="11"
        x2="20.5"
        y2="11"
        className="stroke-[#dcc392]"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <line
        x1="13"
        y1="15"
        x2="18.5"
        y2="15"
        className="stroke-[#dcc392]/80"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* bookmark ribbon */}
      <path d="M16 3 L20 3 L20 12 L18 9.5 L16 12 Z" className="fill-brand-500" />
    </svg>
  );
}
