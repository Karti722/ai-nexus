import { Fragment, type ReactNode } from "react";

/**
 * A small, reusable set of "printed textbook figure" diagrams, in the same
 * visual language as ArchitectureDiagram.tsx (plain styled boxes and
 * typographic arrows, not literal hand-drawn SVG paths and not Mermaid):
 * consistent, fast to produce correctly at volume, and legible at a glance.
 * Used throughout the interview-prep page, one per explanation.
 */

interface Step {
  label: string;
  sub?: string;
}

function Box({ step, tone = "default" }: { step: Step; tone?: "default" | "accent" }) {
  return (
    <div
      className={`rounded-sm border px-3 py-2 text-center font-display text-[11px] font-semibold leading-snug ${
        tone === "accent"
          ? "border-brand-500/40 bg-brand-50 text-brand-600"
          : "border-paper-ink/30 bg-white text-paper-ink"
      }`}
    >
      {step.label}
      {step.sub && <div className="mt-0.5 text-[10px] font-normal normal-case text-paper-ink/50">{step.sub}</div>}
    </div>
  );
}

function FigureShell({ children, caption }: { children: ReactNode; caption: string }) {
  return (
    <figure className="my-2">
      <div className="rounded-sm border border-paper-ink/15 bg-paper-ink/[0.02] p-3 sm:p-4">{children}</div>
      <figcaption className="mt-1.5 text-center text-[11px] italic text-paper-ink/50">{caption}</figcaption>
    </figure>
  );
}

/** A straight sequence of steps, top to bottom, joined by a plain arrow. */
export function FlowFigure({ steps, caption }: { steps: Step[]; caption: string }) {
  return (
    <FigureShell caption={caption}>
      <div className="flex flex-col items-center gap-1.5">
        {steps.map((step, i) => (
          <Fragment key={step.label}>
            <Box step={step} tone={i === steps.length - 1 ? "accent" : "default"} />
            {i < steps.length - 1 && <span className="text-paper-ink/30">↓</span>}
          </Fragment>
        ))}
      </div>
    </FigureShell>
  );
}

/** The same sequence, left to right, for things that read as a pipeline. */
export function PipelineFigure({ steps, caption }: { steps: Step[]; caption: string }) {
  return (
    <FigureShell caption={caption}>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {steps.map((step, i) => (
          <Fragment key={step.label}>
            <Box step={step} tone={i === steps.length - 1 ? "accent" : "default"} />
            {i < steps.length - 1 && <span className="shrink-0 text-paper-ink/30">→</span>}
          </Fragment>
        ))}
      </div>
    </FigureShell>
  );
}

/** One trunk box, an arrow down, then several parallel branch boxes. */
export function BranchFigure({
  trunk,
  branches,
  caption,
}: {
  trunk: Step;
  branches: Step[];
  caption: string;
}) {
  return (
    <FigureShell caption={caption}>
      <div className="flex flex-col items-center gap-1.5">
        <Box step={trunk} />
        <span className="text-paper-ink/30">↓</span>
        <div className="flex flex-wrap justify-center gap-2">
          {branches.map((b) => (
            <Box key={b.label} step={b} tone="accent" />
          ))}
        </div>
      </div>
    </FigureShell>
  );
}

/** Two columns side by side, for a before/after or a head-to-head trade-off. */
export function CompareFigure({
  leftTitle,
  leftItems,
  rightTitle,
  rightItems,
  caption,
}: {
  leftTitle: string;
  leftItems: string[];
  rightTitle: string;
  rightItems: string[];
  caption: string;
}) {
  return (
    <FigureShell caption={caption}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-sm border border-paper-ink/20 bg-white p-2.5">
          <p className="text-center font-display text-[11px] font-bold uppercase tracking-wide text-paper-ink/60">
            {leftTitle}
          </p>
          <ul className="mt-1.5 space-y-1 text-[11px] text-paper-ink/70">
            {leftItems.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-sm border border-brand-500/30 bg-brand-50 p-2.5">
          <p className="text-center font-display text-[11px] font-bold uppercase tracking-wide text-brand-600">
            {rightTitle}
          </p>
          <ul className="mt-1.5 space-y-1 text-[11px] text-paper-ink/70">
            {rightItems.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </FigureShell>
  );
}

/** A single lightweight glyph + label, for a one-fact explanation that
 * doesn't need a full flow (a FAQ answer, a single scope decision). */
export function BadgeFigure({ glyph, label, caption }: { glyph: string; label: string; caption: string }) {
  return (
    <figure className="my-2 flex items-center gap-3 rounded-sm border border-paper-ink/15 bg-paper-ink/[0.02] p-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-500/40 bg-brand-50 font-display text-sm font-bold text-brand-600">
        {glyph}
      </div>
      <figcaption className="text-[11px] italic leading-snug text-paper-ink/60">
        <span className="not-italic font-semibold text-paper-ink/80">{label}</span> — {caption}
      </figcaption>
    </figure>
  );
}
