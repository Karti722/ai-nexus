"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * A single page-wide switch between the technical and beginner-friendly
 * phrasing of every AI-mechanism explanation, rather than a toggle repeated
 * next to each one. `ExplainModeProvider` holds the one piece of state and
 * renders the switch itself; `Explanation` just reads it.
 */

const ExplainModeContext = createContext<"technical" | "beginner">("technical");

/** Rendered through a portal straight to `document.body`, not in its normal
 * place in the tree. `position: fixed` is only ever fixed to the viewport as
 * long as no ancestor has a `transform` (even `translate-y-0` counts); this
 * page wraps everything in scroll-reveal animations that do exactly that,
 * which used to drag this toggle along with the page instead of leaving it
 * pinned to the corner. A portal sidesteps the problem entirely: wherever
 * `ExplainModeProvider` is used, this button always mounts directly under
 * `<body>`, with no transformed ancestor in between, ever. */
function FloatingToggle({
  mode,
  setMode,
}: {
  mode: "technical" | "beginner";
  setMode: (m: "technical" | "beginner") => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-1 sm:bottom-6 sm:right-6">
      <span className="font-display text-[10px] font-bold uppercase tracking-wide text-paper-ink/50">
        Features Explanation
      </span>
      <div className="flex rounded-sm border border-paper-ink/20 bg-white p-0.5 shadow-[0_8px_20px_-8px_rgba(43,38,32,0.45)]">
        <button
          type="button"
          onClick={() => setMode("technical")}
          className={`rounded-sm px-3 py-1.5 font-display text-xs font-semibold transition ${
            mode === "technical" ? "bg-brand-500 text-white" : "text-paper-ink/60 hover:text-paper-ink"
          }`}
        >
          Technical
        </button>
        <button
          type="button"
          onClick={() => setMode("beginner")}
          className={`rounded-sm px-3 py-1.5 font-display text-xs font-semibold transition ${
            mode === "beginner" ? "bg-brand-500 text-white" : "text-paper-ink/60 hover:text-paper-ink"
          }`}
        >
          Beginner
        </button>
      </div>
    </div>,
    document.body
  );
}

const STORAGE_KEY = "ai-nexus-reading-level";

export function ExplainModeProvider({ children }: { children: ReactNode }) {
  // Starts as "technical" on every render (server and first client render
  // have to match, or React's hydration complains), then a mount-only effect
  // below swaps in whatever was saved last time, if anything was.
  const [mode, setMode] = useState<"technical" | "beginner">("technical");
  const startRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "technical" || saved === "beginner") setMode(saved);
    } catch {
      // Private browsing / blocked storage: just keep the "technical" default.
    }
  }, []);

  function updateMode(next: "technical" | "beginner") {
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the toggle still works for this visit, it just
      // won't be remembered next time.
    }

    // If you're still above this section (haven't scrolled to it yet), the
    // toggle would otherwise do nothing visible, which is exactly what
    // caused confusion before. Only scroll when its top hasn't been reached
    // yet; if you're already inside or past it, leave your scroll position
    // alone so mid-read clicks don't yank the page around.
    const top = startRef.current?.getBoundingClientRect().top;
    if (top !== undefined && top > 0) {
      startRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <ExplainModeContext.Provider value={mode}>
      <FloatingToggle mode={mode} setMode={updateMode} />
      <div ref={startRef}>{children}</div>
    </ExplainModeContext.Provider>
  );
}

export function Explanation({ technical, beginner }: { technical: ReactNode; beginner: ReactNode }) {
  const mode = useContext(ExplainModeContext);
  return <>{mode === "technical" ? technical : beginner}</>;
}
