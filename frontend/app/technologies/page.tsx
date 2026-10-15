import Link from "next/link";
import { TextbookPage } from "@/components/TextbookPage";

interface TechEntry {
  name: string;
  description: string;
  routes: { href: string; label: string }[];
}

const TECHNOLOGIES: TechEntry[] = [
  {
    name: "Claude (the core AI model)",
    description:
      "Every place this app sounds genuinely intelligent, it's a real call to Anthropic's Claude, not a script and not a canned response (unless no API key is configured, in which case every answer is clearly labeled a mock). Claude answers plain chat questions, generates grounded answers from retrieved knowledge-base passages, reasons through the agent's tool-calling loop, writes abstractive summaries, and produces the diagrams and explanations on the pages below.",
    routes: [
      { href: "/chat", label: "LLM Chat" },
      { href: "/rag", label: "RAG" },
      { href: "/agent", label: "AI Agent" },
      { href: "/summarize", label: "Summarization" },
      { href: "/langgraph", label: "Diagram-Based Explainer" },
    ],
  },
  {
    name: "Prompt engineering",
    description:
      "Every Claude call above is steered by a specific, purpose-built set of instructions, not improvised per request: a persona and tone for plain chat, a strict \"answer only from these passages and cite them\" rule for retrieval, a think-act-observe loop for the agent, and a \"paraphrase, don't copy\" rule for summarization.",
    routes: [{ href: "/chat", label: "see it in LLM Chat" }],
  },
  {
    name: "Token counting and cost estimation",
    description:
      "Before you ever send a request, this app can tell you exactly how many tokens it costs and what that costs in real dollars, using Claude's own token-counting endpoint rather than an estimate.",
    routes: [{ href: "/tokenizer", label: "Tokenization & Cost" }],
  },
  {
    name: "Embeddings (Voyage AI)",
    description:
      "A second AI model, separate from Claude, turns text into a list of numbers positioned so that similar meanings end up near each other. This is the mechanism that makes every kind of real text search in this app possible, including the ones below that never call Claude at all.",
    routes: [
      { href: "/rag", label: "RAG" },
      { href: "/agent", label: "AI Agent" },
      { href: "/cache", label: "Semantic Caching" },
      { href: "/summarize", label: "Summarization" },
      { href: "/eval", label: "Evaluating AI Outputs" },
      { href: "/langgraph", label: "Diagram-Based Explainer" },
    ],
  },
  {
    name: "Retrieval-augmented generation (RAG)",
    description:
      "Before answering a question, the app actually searches a real database of reference articles for the most relevant passages, then asks Claude to answer using only what it found, with citations. The agent and the diagram-based explainer both reuse this exact same search rather than a separate copy of it.",
    routes: [{ href: "/rag", label: "RAG" }],
  },
  {
    name: "AI agents and tool use",
    description:
      "Lets an AI decide on its own whether it needs a calculator, a knowledge-base search, or an outside tool to answer you, then actually calls it, reads the real result, and keeps going until it has a real answer, rather than just describing what it would do.",
    routes: [{ href: "/agent", label: "AI Agent" }],
  },
  {
    name: "Model Context Protocol (MCP)",
    description:
      "Turn on \"use MCP tools\" on the agent page and it reaches a second, completely separate program over a real, open protocol, the same one Claude Desktop and Claude Code use, for live weather data and other tools. Not a simulated version of the idea.",
    routes: [{ href: "/agent", label: "AI Agent" }],
  },
  {
    name: "LangChain and LangGraph",
    description:
      "A different approach than the hand-built agent above: a fixed, multi-step pipeline (look things up, draw a diagram, write an explanation) built with the same libraries real production AI applications use for structured, multi-step AI workflows.",
    routes: [{ href: "/langgraph", label: "Diagram-Based Explainer" }],
  },
  {
    name: "Semantic caching",
    description:
      "A real cost-saving technique production AI systems lean on heavily: reusing a previous answer not just when a new question is typed identically, but whenever it means the same thing closely enough. This page lets you watch that happen live.",
    routes: [{ href: "/cache", label: "Semantic Caching" }],
  },
  {
    name: "Text summarization",
    description:
      "Two genuinely different ways to shorten text, side by side: one has the AI rewrite it in its own words, the other selects and ranks the document's own most important sentences without inventing a single word, alongside real keyword extraction and a readability score for both versions.",
    routes: [{ href: "/summarize", label: "Summarization" }],
  },
  {
    name: "Evaluating AI outputs",
    description:
      "Instead of just eyeballing whether an AI's answer is \"good,\" this page actually scores it against a reference answer using the same kinds of checks real teams run before trusting a prompt or model change.",
    routes: [{ href: "/eval", label: "Evaluating AI Outputs" }],
  },
];

function RouteLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-paper-ink/70 underline decoration-paper-ink/25 decoration-dotted underline-offset-4 transition hover:text-brand-700 hover:decoration-brand-500"
    >
      {label}
    </Link>
  );
}

export default function TechnologiesPage() {
  return (
    <div className="space-y-10">
      <TextbookPage
        eyebrow="Reference"
        title="Every AI Technology in This App"
        pageNumber="Technologies"
        prevPage={{ href: "/glossary", label: "Glossary of Key Terms" }}
      >
        <p>
          A plain-language overview of every real AI technology actually running in this app, and
          exactly which page lets you see each one working for yourself. Nothing here is a mockup:
          every item below is a genuine working system, reachable through the pages linked next to it.
        </p>

        <div className="mt-2 space-y-8">
          {TECHNOLOGIES.map((tech) => (
            <div key={tech.name} className="border-t border-paper-ink/10 pt-6 first:border-t-0 first:pt-0">
              <h2 className="font-display text-lg font-bold text-paper-ink">{tech.name}</h2>
              <p className="mt-2">{tech.description}</p>
              <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                <span className="font-display text-xs font-bold uppercase tracking-wide text-paper-ink/40">
                  Try it:
                </span>
                {tech.routes.map((route, i) => (
                  <span key={route.href}>
                    <RouteLink href={route.href} label={route.label} />
                    {i < tech.routes.length - 1 && <span className="text-paper-ink/30">, </span>}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </TextbookPage>
    </div>
  );
}
