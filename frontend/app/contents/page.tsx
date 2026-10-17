import Link from "next/link";
import { TextbookPage } from "@/components/TextbookPage";
import { Reveal } from "@/components/Reveal";

const CHAPTERS = [
  {
    number: "Chapter 1",
    href: "/tokenizer",
    title: "Tokenization and the Cost of a Request",
    description: "The exact token count Claude actually bills for, and what that costs to call.",
    part: "Part I — Foundations",
  },
  {
    number: "Chapter 2",
    href: "/chat",
    title: "Large Language Models",
    description: "How a model turns a prompt into a reply, one token at a time.",
    part: "Part I — Foundations",
  },
  {
    number: "Chapter 3",
    href: "/rag",
    title: "Retrieval-Augmented Generation",
    description: "Teaching an AI to look things up before it answers.",
    part: "Part I — Foundations",
  },
  {
    number: "Chapter 4",
    href: "/agent",
    title: "AI Agents and Tool Use",
    description: "Watching an AI decide, act and use outside tools on its own.",
    part: "Part II — Applied Techniques",
  },
  {
    number: "Chapter 5",
    href: "/summarize",
    title: "Automatic Text Summarization",
    description: "Ranking a document's own sentences to condense it, without inventing a word.",
    part: "Part II — Applied Techniques",
  },
  {
    number: "Chapter 6",
    href: "/cache",
    title: "Semantic Caching",
    description: "Skipping a model call entirely when a new question means the same thing as an old one.",
    part: "Part II — Applied Techniques",
  },
  {
    number: "Chapter 7",
    href: "/eval",
    title: "Evaluating AI Outputs",
    description: "Scoring an answer against a reference instead of just eyeballing it.",
    part: "Part II — Applied Techniques",
  },
  {
    number: "Chapter 8",
    href: "/enterprise",
    title: "These Concepts in the Real World",
    description: "Real companies, real numbers: how this stuff is actually used at scale.",
    part: "Part III — Beyond the Model",
  },
  {
    number: "Chapter 9",
    href: "/architecture",
    title: "The System Behind This Tutorial",
    description: "A behind-the-scenes tour of the system running these chapters.",
    part: "Part III — Beyond the Model",
  },
  {
    number: "Chapter 10",
    href: "/workflows",
    title: "A Personalized, Diagram-Based Explainer",
    description: "Ask your own question and get back a real diagram and explanation built just for it.",
    part: "Part III — Beyond the Model",
  },
  {
    number: "Chapter 11",
    href: "/building",
    title: "How This Tutorial Was Built",
    description: "The story of how an AI coding assistant and a person built this, together.",
    part: "Part III — Beyond the Model",
  },
];

/**
 * The book's table of contents, on its own page rather than printed on the
 * cover: a real book's cover is just a title and a blurb, the chapter list
 * is a few pages in. Splitting it out of app/page.tsx (which is now just
 * the cover) keeps that page a single, clean "start here" moment while
 * still giving a visitor who wants to browse or skip ahead a real,
 * dedicated place to do it, same as Glossary and Technologies.
 */
export default function ContentsPage() {
  return (
    <div className="space-y-10">
      <TextbookPage
        eyebrow="Contents"
        title="Table of Contents"
        pageNumber="Page ii"
        prevPage={{ href: "/", label: "Cover" }}
        nextPage={{ href: "/introduction", label: "Introduction: Why This Guide Exists" }}
      >
        <Link
          href="/introduction"
          className="group flex items-baseline gap-3 border-b border-paper-ink/10 py-3 transition hover:border-brand-500/40"
        >
          <span className="shrink-0 font-display text-sm font-semibold italic text-paper-ink transition group-hover:text-brand-700">
            Introduction: Why This Guide Exists
          </span>
        </Link>

        <ol className="space-y-1">
          {CHAPTERS.map((chapter, index) => (
            <li key={chapter.href}>
              <Reveal>
                {chapter.part !== CHAPTERS[index - 1]?.part && (
                  <div className="mb-1 mt-8 flex items-baseline gap-3 first:mt-6">
                    <span className="shrink-0 font-display text-[11px] font-bold uppercase tracking-[0.25em] text-brand-600/70">
                      {chapter.part}
                    </span>
                    <span className="h-px flex-1 bg-paper-ink/10" aria-hidden />
                  </div>
                )}
                <div className="group flex items-start gap-4 sm:gap-6">
                  <span
                    className="hidden shrink-0 pt-2 font-display text-4xl font-black leading-none text-paper-ink/10 transition group-hover:text-brand-500/25 sm:block sm:text-5xl"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={chapter.href}
                      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-paper-ink/10 py-4 transition group-hover:border-brand-500/40"
                    >
                      <span className="shrink-0 font-display text-xs font-bold uppercase tracking-widest text-brand-600 transition group-hover:text-brand-800">
                        {chapter.number}
                      </span>
                      <span className="font-display text-lg font-semibold text-paper-ink transition group-hover:text-brand-700 sm:text-xl">
                        {chapter.title}
                      </span>
                    </Link>
                    <p className="pt-1 text-sm text-paper-ink/50 transition group-hover:text-paper-ink/70">
                      {chapter.description}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <Link href="/glossary" className="group flex items-baseline gap-3 py-2 transition">
          <span className="shrink-0 font-display text-sm italic text-paper-ink/60 transition group-hover:text-brand-700">
            Glossary of Key Terms
          </span>
        </Link>

        <Link href="/technologies" className="group flex items-baseline gap-3 py-2 transition">
          <span className="shrink-0 font-display text-sm italic text-paper-ink/60 transition group-hover:text-brand-700">
            Every AI Technology in This App
          </span>
        </Link>
      </TextbookPage>
    </div>
  );
}
