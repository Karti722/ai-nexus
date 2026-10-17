import Link from "next/link";
import { LandingBook } from "@/components/LandingBook";

/**
 * The book's cover: title, byline, a one-line pitch and the two ways to
 * start, nothing else. The full table of contents used to live here too,
 * but a real book's cover doesn't print its chapter list; that's its own
 * page a few leaves in (see app/contents/page.tsx), which the "open to
 * begin reading" book (LandingBook.tsx) links to directly.
 */
export default function HomePage() {
  return (
    <div className="relative mx-auto max-w-3xl overflow-hidden rounded-sm bg-paper px-5 py-10 text-center font-serif text-paper-ink shadow-[0_20px_45px_-25px_rgba(43,38,32,0.35)] sm:px-16 sm:py-20">
      <div
        className="pointer-events-none absolute right-0 top-0 h-11 w-11 bg-paper-dark"
        style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
        aria-hidden
      />

      <p className="font-display text-xs font-bold uppercase tracking-[0.25em] text-brand-600 sm:tracking-[0.35em]">
        An Interactive Tutorial
      </p>

      <h1 className="mt-4 font-display text-4xl font-black leading-none tracking-tight text-paper-ink sm:text-6xl md:text-8xl">
        AI Nexus
      </h1>

      <p className="mt-3 font-display text-sm italic text-paper-ink/50 sm:text-base">
        by{" "}
        <a
          href="https://kartikeyakumaria.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-paper-ink/70 underline decoration-paper-ink/25 underline-offset-4 transition hover:text-brand-700 hover:decoration-brand-500"
        >
          Kartikeya Kumaria
        </a>
      </p>

      <p className="mx-auto mt-6 max-w-xl text-base italic leading-relaxed text-paper-ink/70 sm:text-lg">
        A hands-on introduction to large language models, retrieval and AI agents: learn how
        modern AI actually works by using it yourself, no experience required.
      </p>

      <p className="mt-8 font-display text-xs font-bold uppercase tracking-[0.2em] text-paper-ink/40">
        Two ways to start
      </p>

      <div className="mx-auto mt-3 flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-stretch">
        <LandingBook />

        <Link
          href="/explain"
          className="group flex flex-col items-center justify-center gap-1.5 rounded-sm border border-brand-500/30 bg-brand-500/[0.05] px-6 py-5 text-sm text-paper-ink/80 transition hover:border-brand-500/50 hover:bg-brand-500/[0.08] sm:max-w-[15rem]"
        >
          <span className="underline decoration-paper-ink/25 underline-offset-4 transition group-hover:text-brand-700 group-hover:decoration-brand-500">
            Generate a personalized explanation of this app
          </span>
          <span className="shrink-0 text-xs italic text-paper-ink/50">
            (recommended if reading isn't your style)
          </span>
        </Link>
      </div>

      <div className="mt-14 flex items-center justify-between border-t border-paper-ink/15 pt-3 font-display text-xs uppercase tracking-widest text-paper-ink/40">
        <span>AI Nexus: An Interactive Tutorial</span>
        <span>Page i</span>
      </div>
    </div>
  );
}
