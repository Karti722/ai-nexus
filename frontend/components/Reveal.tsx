"use client";

import { Children, isValidElement, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Fades + slides a block up into place the first time it scrolls into view,
 * then leaves it alone (never re-triggers). Respects prefers-reduced-motion
 * by skipping straight to visible. The `js-reveal` class is a safety net for
 * the rare no-JS case: layout.tsx's <noscript> style forces it visible, so
 * content never depends on JavaScript running to be readable.
 */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      // threshold is a fraction of the TARGET's own total area, not the
      // viewport: for a very tall target (e.g. the whole interview-prep
      // page, wrapped as one Reveal), the visible portion at any scroll
      // position never reaches a nonzero percentage of its own huge height,
      // so a threshold above 0 can mean isIntersecting never fires at all,
      // leaving the content permanently invisible. 0 fires as soon as even
      // one pixel is visible, correct regardless of how tall the target is.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);

    // Safety net: if something about a given browser/element ever stops the
    // observer from firing, force visibility after a couple of seconds
    // rather than leaving content permanently invisible. A late, skipped
    // animation is a minor cosmetic miss; content that never appears at all
    // is a real failure.
    const fallback = window.setTimeout(() => setVisible(true), 2500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`js-reveal transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** Wraps every direct child in its own `Reveal`, so a long page of prose and
 * figures gently reveals piece by piece as you scroll through it, instead of
 * all at once or not at all. Each child animates independently, on its own
 * scroll position, not a fixed stagger from page load (which would make
 * content far down the page wait several seconds after it's already visible). */
export function RevealGroup({ children }: { children: ReactNode }) {
  return (
    <>
      {Children.map(children, (child) =>
        isValidElement(child) ? (
          <Reveal key={child.key ?? undefined}>{child}</Reveal>
        ) : (
          child
        )
      )}
    </>
  );
}
