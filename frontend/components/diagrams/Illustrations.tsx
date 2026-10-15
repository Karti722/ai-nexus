/**
 * A small family of purely decorative illustrations for the interview-prep
 * page, in the same hand-drawn, inline-SVG style as HomeIllustration.tsx
 * (open book + brand-accent spark), reused at major section breaks to add
 * visual variety without turning into more informational diagrams, there
 * are already plenty of those (Figures.tsx).
 */

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <figure className="my-3 flex justify-center">
      <svg viewBox="0 0 160 90" className="h-16 w-auto sm:h-20" role="img" aria-label={label}>
        {children}
      </svg>
    </figure>
  );
}

/** A notebook with a pen beside it: used once, near the top of the page. */
export function NotebookIllustration() {
  return (
    <Frame label="A notebook with a pen, representing personal notes">
      <rect x="40" y="14" width="64" height="62" rx="3" className="fill-white stroke-paper-ink/35" strokeWidth="1.5" />
      <line x1="52" y1="14" x2="52" y2="76" className="stroke-paper-ink/15" strokeWidth="1.5" />
      <line x1="62" y1="28" x2="94" y2="28" className="stroke-paper-ink/25" strokeWidth="2" />
      <line x1="62" y1="38" x2="94" y2="38" className="stroke-paper-ink/25" strokeWidth="2" />
      <line x1="62" y1="48" x2="86" y2="48" className="stroke-paper-ink/20" strokeWidth="2" />
      <g transform="translate(108 12) rotate(28)">
        <rect x="0" y="0" width="7" height="46" rx="3" className="fill-brand-500" />
        <path d="M0 46 L7 46 L3.5 56 Z" className="fill-brand-600" />
        <rect x="0" y="0" width="7" height="8" rx="3" className="fill-paper-ink/70" />
      </g>
    </Frame>
  );
}

/** Three gears meshing together: engineering / architecture decisions. */
export function GearsIllustration() {
  function Gear({ cx, cy, r, className }: { cx: number; cy: number; r: number; className: string }) {
    const teeth = 8;
    const points: string[] = [];
    for (let i = 0; i < teeth; i++) {
      const a1 = (i / teeth) * 2 * Math.PI;
      const a2 = ((i + 0.5) / teeth) * 2 * Math.PI;
      const outer = r + 4;
      points.push(`${cx + outer * Math.cos(a1)},${cy + outer * Math.sin(a1)}`);
      points.push(`${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)}`);
    }
    return (
      <g>
        <polygon points={points.join(" ")} className={className} />
        <circle cx={cx} cy={cy} r={r * 0.4} className="fill-paper" />
      </g>
    );
  }
  return (
    <Frame label="Three interlocking gears, representing architecture decisions">
      <Gear cx={56} cy={40} r={20} className="fill-white stroke-paper-ink/35" />
      <Gear cx={96} cy={30} r={13} className="fill-brand-50 stroke-brand-500/50" />
      <Gear cx={100} cy={58} r={10} className="fill-white stroke-paper-ink/30" />
    </Frame>
  );
}

/** A simple cloud, for the Google Cloud section. */
export function CloudIllustration() {
  return (
    <Frame label="A cloud shape, representing cloud deployment">
      <path
        d="M40 58 a14 14 0 0 1 0-28 a18 18 0 0 1 35-6 a14 14 0 0 1 17 20 a12 12 0 0 1 -4 24 H44 a12 12 0 0 1 -4-10 Z"
        className="fill-white stroke-paper-ink/35"
        strokeWidth="1.5"
      />
      <circle cx="80" cy="30" r="3" className="fill-brand-500" />
      <circle cx="88" cy="22" r="1.8" className="fill-brand-400" />
    </Frame>
  );
}

/** A small compass: a starting point, for "explained from zero." */
export function CompassIllustration() {
  return (
    <Frame label="A compass, representing a starting point for a beginner">
      <circle cx="80" cy="45" r="28" className="fill-white stroke-paper-ink/35" strokeWidth="1.5" />
      <circle cx="80" cy="45" r="22" className="fill-none stroke-paper-ink/15" strokeWidth="1" />
      <polygon points="80,28 86,45 80,62 74,45" className="fill-brand-500" />
      <circle cx="80" cy="45" r="2.5" className="fill-paper-ink/70" />
    </Frame>
  );
}
