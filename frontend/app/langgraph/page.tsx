import { AppExplainer } from "@/components/AppExplainer";
import { Analogy } from "@/components/Analogy";
import { TextbookPage } from "@/components/TextbookPage";
import { Sources } from "@/components/Sources";

export default function LangGraphPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-paper-ink/50">
          Try it yourself
        </h2>
        <AppExplainer />
      </div>

      <TextbookPage
        eyebrow="Chapter 11"
        title="A Personalized, Diagram-Based Explainer"
        pageNumber="Page 11"
        prevPage={{ href: "/building", label: "Chapter 10: How This Tutorial Was Built" }}
        nextPage={{ href: "/glossary", label: "Glossary" }}
      >
        <p>
          Chapter 9 explains this app's architecture, but it does so the same way for every
          reader: one fixed diagram, one fixed block of text, regardless of what that specific
          person actually wants to understand. The feature above works differently. Ask it your
          own question, in your own words, and it builds a diagram and an explanation scoped to
          exactly what you asked, not a page everyone sees identically.
        </p>

        <p>
          It's built with <strong>LangChain</strong> and <strong>LangGraph</strong>, two related
          but distinct tools. LangChain is a general toolkit for building applications around
          language models: standardized ways to call different providers, format prompts and
          structure a model's output. <strong>LangGraph</strong>, built on top of it, is
          specifically for defining a multi-step AI workflow as an explicit graph: a set of
          steps, and a set of connections between them, rather than one single prompt or one
          fixed loop. This page's own feature is a real example: retrieve real information, then
          generate a diagram from it, then generate a written explanation from the same
          information, three separate steps, run in that fixed order every time.
        </p>

        <Analogy>
          A single prompt to a model is like asking someone a question and getting one answer
          back immediately. LangGraph is more like giving someone a checklist: first go look
          something up, then draw what you found, then write up what it means, each step
          building on the last, with the order and connections between steps decided in advance
          rather than left entirely to the model's own judgment in the moment.
        </Analogy>

        <p>
          This is a different use of the same underlying idea Chapter 4's agent already
          demonstrates. Chapter 4's agent decides for itself, step by step, which tool to use
          next. This page's workflow is simpler and more fixed by comparison: retrieve, draw,
          explain, always in that order, which fits a task that doesn't need an agent's own
          judgment about what to do next, just a reliable pipeline that always does the same
          three things well.
        </p>

        <div className="border-l-[3px] border-amber-700/40 bg-paper-ink/[0.035] py-3 pl-5 pr-4">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-amber-800">
            In this demo
          </p>
          <p className="mt-2 text-[16px]">Every question you ask above goes through three real steps:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Your question is embedded and searched against the same real, pgvector-backed
              knowledge base Chapter 3's RAG demo uses, so the diagram and explanation are
              grounded in real retrieved passages, not invented from nothing
            </li>
            <li>
              A real call to Claude turns those passages into a Mermaid diagram definition, plain
              text describing which boxes exist and how they connect; a separate, deterministic
              renderer (not the model) turns that text into the actual diagram you see
            </li>
            <li>
              A second real call to Claude writes the accompanying explanation from the same
              retrieved passages
            </li>
          </ul>
        </div>

        <p>
          There's also a plain, standalone version of this same feature at{" "}
          <a
            href="/explain"
            className="underline decoration-paper-ink/25 underline-offset-4 transition hover:text-brand-700 hover:decoration-brand-500"
          >
            /explain
          </a>
          , with none of this chapter's own explanation attached, meant for someone who wants
          the app explained to them before they've decided to read a chapter about how it works.
        </p>

        <Sources
          items={[
            {
              label: "LangChain, \"LangGraph\": official documentation",
              href: "https://langchain-ai.github.io/langgraph/",
            },
            {
              label: "Mermaid: official documentation",
              href: "https://mermaid.js.org/",
            },
          ]}
        />
      </TextbookPage>
    </div>
  );
}
