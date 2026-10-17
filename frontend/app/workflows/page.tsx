import { AppExplainer } from "@/components/AppExplainer";
import { Analogy } from "@/components/Analogy";
import { TextbookPage } from "@/components/TextbookPage";
import { LangGraphIllustration } from "@/components/ChapterIllustrations";
import { LangChainDemo } from "@/components/LangChainDemo";
import { Sources } from "@/components/Sources";

export default function WorkflowsPage() {
  return (
    <div className="space-y-10">
      <TextbookPage
        eyebrow="Chapter 10"
        title="A Personalized, Diagram-Based Explainer"
        pageNumber="Page 10"
        prevPage={{ href: "/architecture", label: "Chapter 9: The System Behind This Tutorial" }}
        nextPage={{ href: "/building", label: "Chapter 11: How This Tutorial Was Built" }}
      >
        <LangGraphIllustration />
        <a
          href="#try-it"
          className="mx-auto block w-fit text-sm text-paper-ink/60 underline decoration-paper-ink/25 decoration-dotted underline-offset-4 transition hover:text-brand-700 hover:decoration-brand-500"
        >
          ↓ Try it yourself
        </a>
        <p>
          Chapter 9 explains this app's architecture, but it does so the same way for every
          reader: one fixed diagram, one fixed block of text, regardless of what that specific
          person actually wants to understand. The feature below works differently. Ask it your
          own question, in your own words, and it builds a diagram and an explanation scoped to
          exactly what you asked, not a page everyone sees identically.
        </p>

        <p>
          It's built with two related but genuinely distinct tools from the same ecosystem:{" "}
          <strong>LangChain</strong> and <strong>LangGraph</strong>. People new to both tend to
          collapse them into one thing because they're developed by the same company and
          typically imported together, but they solve different problems, and this page's own
          backend code uses both of them separately, in different files and for different jobs.
        </p>

        <p>
          <strong>LangChain</strong> is the older and more general of the two: a library of
          standardized building blocks for a single call to a language model. Instead of writing
          provider-specific HTTP calls for Claude, then separate ones for GPT-4 or a local model,
          LangChain gives every provider the same interface, so switching providers is a one-line
          change instead of a rewrite. It also supplies reusable pieces around that one call:
          prompt templates (fill-in-the-blank wrappers around a system prompt, so the surrounding
          instructions don't get retyped for every request), and typed message objects for the
          system instructions and the human's input, rather than hand-built JSON. A single
          LangChain call, by itself, has no multi-step workflow at all: prompt in, one model call,
          text back out. That's exactly what this page's <code>diagram</code> and{" "}
          <code>explain</code> steps each do under the hood, through LangChain's{" "}
          <code>ChatAnthropic</code> class and its <code>SystemMessage</code>/
          <code>HumanMessage</code> types, visible directly in this app's backend source
          (<code>backend/src/explainer/buildAndRun.ts</code>). Chapter 1's token-cost calculator
          and Chapter 4's agent make the same kind of single call to Claude, just via the raw
          Anthropic SDK instead of LangChain's wrapper around it, which is why this feature, not
          those, is the one actually demonstrating what LangChain is for.
        </p>

        <Analogy>
          Calling a hosted model's API directly is like phoning one specific restaurant and
          reciting their exact order codes from memory. LangChain is a universal ordering app:
          say what you want once, in one standard way, and it translates that into whichever
          backend's own format is actually behind the button you pressed, Claude today, a
          different provider tomorrow, without the person ordering ever noticing the difference.
        </Analogy>

        <p>
          <strong>LangGraph</strong>, built on top of LangChain, solves a different problem: once
          an application needs more than one model call, in some fixed or branching order,
          something has to track which step runs next and what accumulated state, the original
          question, the passages retrieved so far, the diagram once it exists, gets carried
          forward into the next one. LangGraph's answer is an explicit graph: named nodes, each a
          plain function that reads the shared state and returns updates to it, wired together
          with edges that declare which node is allowed to run after which. Real production uses
          go well beyond this page's fixed three-step line: a customer-support bot that retries a
          failed tool call once before escalating to a human, a coding assistant that loops back
          to search again if its first attempt at a fix doesn't compile, or a claims-processing
          pipeline with a conditional edge that skips an expensive manual-review step entirely
          once a cheaper automated check already clears the claim. This page's own feature is the
          simplest shape that idea can take: a <code>StateGraph</code> with exactly three nodes,{" "}
          <code>retrieve</code>, <code>diagram</code>, and <code>explain</code>, wired{" "}
          <code>START → retrieve → diagram → explain → END</code> in one straight line, with no
          branching or retries, because unlike the examples above, this particular task never
          needs to double back.
        </p>

        <Analogy>
          A single LangChain call is like asking someone one question and getting one answer
          back immediately, nothing before it, nothing after. LangGraph is more like handing
          someone a checklist that can also branch: first go look something up, then draw what
          you found, then write up what it means, each step building on the state the last one
          left behind, and able to loop back or skip ahead on a condition, with the order and
          connections between steps decided in advance rather than left entirely to the model's
          own judgment in the moment the way Chapter 4's agent decides for itself.
        </Analogy>

        <div className="border-l-[3px] border-amber-700/40 bg-paper-ink/[0.035] py-3 pl-5 pr-4">
          <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-amber-800">
            In this demo
          </p>
          <p className="mt-2 text-[16px]">
            Every question you ask below runs the actual three-node <code>StateGraph</code>{" "}
            described above:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <code>retrieve</code> &mdash; your question is embedded and searched against the
              same real, pgvector-backed knowledge base Chapter 3's RAG demo uses, so the diagram
              and explanation are grounded in real retrieved passages, not invented from nothing
            </li>
            <li>
              <code>diagram</code> &mdash; a real LangChain call to Claude turns those passages
              into a Mermaid diagram definition, plain text describing which boxes exist and how
              they connect; a separate, deterministic renderer (not the model) turns that text
              into the actual diagram you see
            </li>
            <li>
              <code>explain</code> &mdash; a second real LangChain call to Claude writes the
              accompanying explanation from the same retrieved passages
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

      <div id="try-it" className="scroll-mt-20 space-y-3">
        <h2 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-paper-ink/50">
          Try it yourself
        </h2>
        <p className="text-sm text-paper-ink/60">
          Two separate, real implementations, run back to back below so the difference is
          something you can see, not just read about. Same general task, explaining a concept,
          deliberately different machinery underneath.
        </p>
        <LangChainDemo />
        <AppExplainer />
      </div>
    </div>
  );
}
