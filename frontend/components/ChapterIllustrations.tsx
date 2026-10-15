/**
 * One small, purely decorative illustration per chapter, in the same
 * hand-drawn inline-SVG family as HomeIllustration.tsx and
 * diagrams/Illustrations.tsx (white fill, paper-ink stroke, brand-500
 * accent). Each chapter gets a motif loosely matching its own topic.
 */
function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <figure className="my-2 flex justify-center">
      <svg viewBox="0 0 160 90" className="h-16 w-auto sm:h-20" role="img" aria-label={label}>
        {children}
      </svg>
    </figure>
  );
}

/** Ch.1 Tokenizer: a word splitting into small tagged pieces, plus a coin. */
export function TokenizerIllustration() {
  return (
    <Frame label="A word splitting into small tagged token pieces, next to a coin">
      <rect x="20" y="34" width="24" height="22" rx="3" className="fill-white stroke-paper-ink/35" strokeWidth="1.5" />
      <rect x="48" y="34" width="20" height="22" rx="3" className="fill-brand-50 stroke-brand-500/50" strokeWidth="1.5" />
      <rect x="72" y="34" width="16" height="22" rx="3" className="fill-white stroke-paper-ink/35" strokeWidth="1.5" />
      <circle cx="120" cy="45" r="16" className="fill-white stroke-paper-ink/35" strokeWidth="1.5" />
      <text x="120" y="50" textAnchor="middle" className="fill-brand-500" fontSize="16" fontWeight="bold">
        $
      </text>
    </Frame>
  );
}

/** Ch.2 Chat: two overlapping speech bubbles. */
export function ChatIllustration() {
  return (
    <Frame label="Two overlapping speech bubbles, representing a conversation">
      <path
        d="M20 30 h55 a6 6 0 0 1 6 6 v18 a6 6 0 0 1 -6 6 H40 l-10 10 v-10 h-10 a6 6 0 0 1 -6-6 V36 a6 6 0 0 1 6-6 Z"
        className="fill-white stroke-paper-ink/35"
        strokeWidth="1.5"
      />
      <path
        d="M80 20 h55 a6 6 0 0 1 6 6 v16 a6 6 0 0 1 -6 6 h-8 v9 l-9-9 H80 a6 6 0 0 1 -6-6 V26 a6 6 0 0 1 6-6 Z"
        className="fill-brand-50 stroke-brand-500/50"
        strokeWidth="1.5"
      />
    </Frame>
  );
}

/** Ch.3 RAG: a magnifying glass over a stack of documents. */
export function RagIllustration() {
  return (
    <Frame label="A magnifying glass over a stack of documents, representing retrieval">
      <rect x="30" y="24" width="40" height="50" rx="2" className="fill-white stroke-paper-ink/25" strokeWidth="1.5" />
      <rect x="36" y="18" width="40" height="50" rx="2" className="fill-white stroke-paper-ink/35" strokeWidth="1.5" />
      <line x1="44" y1="30" x2="68" y2="30" className="stroke-paper-ink/20" strokeWidth="2" />
      <line x1="44" y1="40" x2="68" y2="40" className="stroke-paper-ink/20" strokeWidth="2" />
      <line x1="44" y1="50" x2="60" y2="50" className="stroke-paper-ink/15" strokeWidth="2" />
      <circle cx="98" cy="48" r="16" className="fill-brand-50/60 stroke-brand-500/60" strokeWidth="2" />
      <line x1="109" y1="59" x2="122" y2="72" className="stroke-brand-500/60" strokeWidth="3" strokeLinecap="round" />
    </Frame>
  );
}

/** Ch.4 Agent: a wrench and a gear, tool-use. */
export function AgentIllustration() {
  return (
    <Frame label="A wrench and a gear, representing an agent using tools">
      <circle cx="56" cy="45" r="18" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <circle cx="56" cy="45" r="7" className="fill-paper" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <rect
          key={deg}
          x="53"
          y="22"
          width="6"
          height="8"
          className="fill-white stroke-paper-ink/30"
          strokeWidth="1"
          transform={`rotate(${deg} 56 45)`}
        />
      ))}
      <g transform="translate(90 55) rotate(-35)">
        <rect x="0" y="0" width="34" height="8" rx="4" className="fill-brand-500" />
        <circle cx="34" cy="4" r="7" className="fill-none stroke-brand-500" strokeWidth="4" />
      </g>
    </Frame>
  );
}

/** Ch.5 Summarize: a long document shrinking into a short one. */
export function SummarizeIllustration() {
  return (
    <Frame label="A long document shrinking down into a short summary">
      <rect x="20" y="18" width="34" height="54" rx="2" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      {[26, 34, 42, 50, 58, 66].map((y) => (
        <line key={y} x1="26" y1={y} x2="48" y2={y} className="stroke-paper-ink/20" strokeWidth="1.5" />
      ))}
      <path d="M62 45 h20" className="stroke-paper-ink/30" strokeWidth="2" markerEnd="url(#arrow)" />
      <polygon points="82,41 90,45 82,49" className="fill-paper-ink/30" />
      <rect x="100" y="30" width="30" height="30" rx="2" className="fill-brand-50 stroke-brand-500/50" strokeWidth="1.5" />
      <line x1="106" y1="40" x2="124" y2="40" className="stroke-brand-500/50" strokeWidth="2" />
      <line x1="106" y1="48" x2="118" y2="48" className="stroke-brand-500/50" strokeWidth="2" />
    </Frame>
  );
}

/** Ch.6 Semantic caching: a repeat/reuse arrow loop. */
export function CacheIllustration() {
  return (
    <Frame label="A circular reuse arrow, representing a cache hit">
      <path
        d="M50 30 a25 25 0 1 1 -17 7"
        className="fill-none stroke-paper-ink/35"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <polygon points="28,30 40,33 32,42" className="fill-paper-ink/35" />
      <circle cx="50" cy="55" r="5" className="fill-brand-500" />
      <rect x="95" y="35" width="34" height="24" rx="3" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <text x="112" y="51" textAnchor="middle" className="fill-brand-600" fontSize="11" fontWeight="bold">
        HIT
      </text>
    </Frame>
  );
}

/** Ch.7 Evaluation: a balanced scale. */
export function EvalIllustration() {
  return (
    <Frame label="A balance scale, representing scoring one answer against a reference">
      <line x1="80" y1="18" x2="80" y2="36" className="stroke-paper-ink/35" strokeWidth="2.5" />
      <line x1="45" y1="24" x2="115" y2="24" className="stroke-paper-ink/35" strokeWidth="2.5" />
      <line x1="45" y1="24" x2="35" y2="50" className="stroke-paper-ink/30" strokeWidth="2" />
      <line x1="115" y1="24" x2="125" y2="50" className="stroke-paper-ink/30" strokeWidth="2" />
      <path d="M22 50 a13 13 0 0 0 26 0 Z" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <path d="M112 50 a13 13 0 0 0 26 0 Z" className="fill-brand-50 stroke-brand-500/50" strokeWidth="1.5" />
      <rect x="72" y="36" width="16" height="30" className="fill-paper-ink/20" />
    </Frame>
  );
}

/** Ch.8 Enterprise: simple city skyline. */
export function EnterpriseIllustration() {
  return (
    <Frame label="A row of city buildings, representing real companies using these ideas">
      <rect x="25" y="40" width="18" height="34" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <rect x="47" y="26" width="20" height="48" className="fill-brand-50 stroke-brand-500/50" strokeWidth="1.5" />
      <rect x="71" y="48" width="16" height="26" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <rect x="91" y="34" width="18" height="40" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <rect x="113" y="54" width="16" height="20" className="fill-brand-50 stroke-brand-500/50" strokeWidth="1.5" />
      <line x1="18" y1="74" x2="136" y2="74" className="stroke-paper-ink/20" strokeWidth="1.5" />
    </Frame>
  );
}

/** Ch.9 Architecture: four connected boxes, a system diagram. */
export function ArchitectureIllustration() {
  return (
    <Frame label="Four small connected boxes, representing a system architecture diagram">
      <rect x="20" y="20" width="26" height="18" rx="2" className="fill-brand-50 stroke-brand-500/50" strokeWidth="1.5" />
      <rect x="20" y="52" width="26" height="18" rx="2" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <rect x="67" y="36" width="26" height="18" rx="2" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <rect x="114" y="20" width="26" height="18" rx="2" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <rect x="114" y="52" width="26" height="18" rx="2" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <line x1="46" y1="29" x2="67" y2="42" className="stroke-paper-ink/25" strokeWidth="1.5" />
      <line x1="46" y1="61" x2="67" y2="48" className="stroke-paper-ink/25" strokeWidth="1.5" />
      <line x1="93" y1="42" x2="114" y2="29" className="stroke-paper-ink/25" strokeWidth="1.5" />
      <line x1="93" y1="48" x2="114" y2="61" className="stroke-paper-ink/25" strokeWidth="1.5" />
    </Frame>
  );
}

/** Ch.10 Building: a hammer and a building block. */
export function BuildingIllustration() {
  return (
    <Frame label="A hammer next to stacked building blocks, representing how the app was built">
      <rect x="30" y="50" width="20" height="20" rx="2" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <rect x="52" y="50" width="20" height="20" rx="2" className="fill-brand-50 stroke-brand-500/50" strokeWidth="1.5" />
      <rect x="41" y="28" width="20" height="20" rx="2" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <g transform="translate(95 20) rotate(40)">
        <rect x="0" y="0" width="8" height="34" rx="2" className="fill-brand-600" />
        <rect x="-10" y="-10" width="28" height="14" rx="3" className="fill-paper-ink/70" />
      </g>
    </Frame>
  );
}

/** Ch.11 LangGraph explainer: a small flowchart of three nodes. */
export function LangGraphIllustration() {
  return (
    <Frame label="Three connected nodes in a row, representing a fixed step-by-step workflow">
      <circle cx="30" cy="45" r="13" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <circle cx="80" cy="45" r="13" className="fill-brand-50 stroke-brand-500/50" strokeWidth="1.5" />
      <circle cx="130" cy="45" r="13" className="fill-white stroke-paper-ink/30" strokeWidth="1.5" />
      <line x1="43" y1="45" x2="67" y2="45" className="stroke-paper-ink/30" strokeWidth="2" />
      <polygon points="67,41 75,45 67,49" className="fill-paper-ink/30" />
      <line x1="93" y1="45" x2="117" y2="45" className="stroke-paper-ink/30" strokeWidth="2" />
      <polygon points="117,41 125,45 117,49" className="fill-paper-ink/30" />
    </Frame>
  );
}
