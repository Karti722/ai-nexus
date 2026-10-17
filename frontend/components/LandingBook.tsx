"use client";

import Link from "next/link";
import { BookIcon } from "@/components/BookIcon";
import { HomeIllustration } from "@/components/HomeIllustration";

/**
 * The homepage's hero book: starts closed, brown cover, same as the nav
 * bar's home-page icon (BrandLogo.tsx) but at hero scale. Hovering,
 * tapping/holding or keyboard-focusing it "opens" the book (crossfades to
 * the open-book illustration, with a small scale-in), with a hint
 * underneath that fades out once it's open since the open book and the
 * click-to-continue become self-evident at that point. Clicking it, since
 * any click necessarily passes through that hover/active state first, goes
 * to the first chapter, Introduction: opening the book is how you start
 * reading. Both SVGs stay in the DOM and crossfade with opacity, so the
 * hero's height never jumps between states.
 *
 * Wrapped in a visible bordered card, at rest, not just on hover: a first-
 * time visitor has no reason to hover an unlabeled illustration to discover
 * it's clickable, and without a border it didn't read as an interactive
 * element at all next to the actual bordered button just below it ("Generate
 * a personalized explanation..."). The border + hint text together make it
 * read as that button's sibling/alternative, not a static logo graphic.
 */
export function LandingBook() {
  return (
    <Link
      href="/introduction"
      aria-label="Open the book and start reading: Introduction"
      className="group mx-auto flex w-fit flex-col items-center gap-2 rounded-sm border border-paper-ink/15 bg-paper-ink/[0.02] px-8 py-5 transition hover:border-brand-500/40 hover:bg-brand-500/[0.04]"
    >
      <span className="relative mx-auto block h-20 w-44 sm:h-24">
        <BookIcon
          className="absolute inset-y-0 left-1/2 h-20 w-auto -translate-x-1/2 opacity-100 transition-all duration-300 ease-out motion-reduce:transition-none group-hover:opacity-0 group-focus-visible:opacity-0 group-active:opacity-0 sm:h-24"
        />
        <HomeIllustration
          className="absolute inset-y-0 left-1/2 h-20 w-auto -translate-x-1/2 scale-90 opacity-0 transition-all duration-300 ease-out motion-reduce:transition-none group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 group-active:scale-100 group-active:opacity-100 sm:h-24"
          decorative
        />
      </span>
      <span
        aria-hidden
        className="block font-serif text-sm italic text-paper-ink/55 opacity-100 transition-opacity duration-200 ease-out motion-reduce:transition-none group-hover:opacity-0 group-focus-visible:opacity-0 group-active:opacity-0"
      >
        open to begin reading →
      </span>
    </Link>
  );
}
