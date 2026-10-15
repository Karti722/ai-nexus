import { TextbookPage } from "@/components/TextbookPage";
import {
  BadgeFigure,
  BranchFigure,
  CompareFigure,
  FlowFigure,
  PipelineFigure,
} from "@/components/diagrams/Figures";
import { Explanation, ExplainModeProvider } from "@/components/diagrams/ExplainMode";
import {
  CloudIllustration,
  CompassIllustration,
  GearsIllustration,
  NotebookIllustration,
} from "@/components/diagrams/Illustrations";

export const metadata = {
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: "summary", label: "One-minute summary" },
  { id: "architecture", label: "Architecture & key decisions" },
  { id: "stack", label: "Full tech stack & what each piece is for" },
  { id: "gcp", label: "Google Cloud: the full deployment picture" },
  { id: "mechanisms", label: "Exactly how each feature works" },
  { id: "bugs", label: "Real bugs found in production" },
  { id: "scope", label: "Deliberate scope decisions" },
  { id: "recent", label: "Recent work: the database migration + cleanup" },
  { id: "built", label: "How it was actually built" },
  { id: "faq", label: "Likely follow-up questions" },
  { id: "beginner", label: "The codebase, explained from zero" },
];

export default function InterviewPrepPage() {
  return (
    <div className="space-y-10">
      <TextbookPage eyebrow="Personal" title="Interview Prep: AI Nexus" pageNumber="Private">
        <NotebookIllustration />
        <p className="italic text-paper-ink/60">
          Reference notes, not a script. Every number, file name and function name below was
          checked against the actual current source right before writing it, not recalled from
          memory, so you can trust it's accurate as of today. Nothing here is aspirational unless
          explicitly marked "considered and rejected."
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 border-y border-paper-ink/10 py-3 text-sm">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-paper-ink/60 underline decoration-paper-ink/25 decoration-dotted underline-offset-4 transition hover:text-brand-700 hover:decoration-brand-500"
            >
              {s.label}
            </a>
          ))}
        </div>

        <h2 id="summary" className="font-display text-lg font-bold text-paper-ink scroll-mt-20">
          One-minute summary
        </h2>
        <p>
          AI Nexus is a full-stack AI engineering platform I designed and built myself, live at
          ai-nexus-textbook.com. It's an interactive textbook: eleven chapters, each teaching one
          real AI engineering concept, and every one is backed by a genuinely working
          implementation calling real APIs, not a mockup or a canned screenshot. It's four
          independently deployed services (a Next.js frontend, an Express/TypeScript backend, a
          Python/FastAPI microservice, and a standalone Model Context Protocol server) talking to
          each other over real network calls, backed by a real Postgres database with the
          pgvector extension, deployed on Google Cloud Run with a full CI/CD pipeline through
          GitHub Actions. Built in about 7 days initially; I've kept iterating on it since,
          including, most recently, a full migration of the knowledge base onto the database as
          its single source of truth and a repo-wide dead-code audit.
        </p>
        <BranchFigure
          trunk={{ label: "A visitor's browser" }}
          branches={[
            { label: "frontend", sub: "Next.js" },
            { label: "backend", sub: "Express" },
            { label: "python-service", sub: "FastAPI" },
            { label: "mcp-server", sub: "stdio" },
          ]}
          caption="Figure 1. Four independently deployed services, one request path through them."
        />

        <GearsIllustration />
        <h2 id="architecture" className="font-display text-lg font-bold text-paper-ink scroll-mt-20">
          Architecture & key decisions
        </h2>
        <p>
          <strong>The four services, concretely:</strong> `frontend/` is a Next.js 14 app (App
          Router) that runs on port 3000 locally and talks to the backend only through
          `frontend/lib/api.ts`, the one file in the whole frontend that knows the backend's
          address. `backend/` is an Express server on port 4000: it's the only service that calls
          Claude directly, and the only service any other part of the system treats as "the API."
          `python-service/` is a FastAPI app on port 8001 that does exactly two kinds of work:
          calling Voyage AI's real embedding API, and running four classical (non-LLM) NLP
          algorithms (TextRank summarization, keyword extraction, Flesch-Kincaid readability, and
          the evaluation metrics). `mcp-server/` isn't reached over the network at all: the
          backend spawns it as a literal child OS process and talks to it over stdin/stdout using
          the Model Context Protocol's JSON-RPC message format, exactly the same mechanism Claude
          Desktop uses to talk to a real MCP server.
        </p>
        <PipelineFigure
          steps={[
            { label: "frontend", sub: "port 3000" },
            { label: "backend", sub: "port 4000" },
            { label: "python-service", sub: "port 8001" },
          ]}
          caption="Figure 2. Each service's real local port; mcp-server has none, it's a child process, not a network service."
        />
        <p>
          <strong>Why split it this way instead of one program:</strong> each service is written
          in whichever language actually fits its job best, not one language picked for
          consistency. Python has the real tooling for embeddings and NLP (the Voyage SDK exists
          for Python, not a hand-rolled equivalent); TypeScript is what the frontend needs and
          what Anthropic's and MCP's own SDKs are written in, so the backend sits in the same
          language as both of the SDKs it depends on most, with no serialization boundary between
          them. The honest cost: four services means four places to deploy, four Dockerfiles, and
          a real network hop (with real failure modes, like a timeout or a 500) everywhere a
          single program would have just been a function call.
        </p>
        <CompareFigure
          leftTitle="One language everywhere"
          leftItems={["Simpler mental model", "No network hop between layers", "Python's AI/NLP tooling reimplemented badly in JS"]}
          rightTitle="Right tool per service (chosen)"
          rightItems={["Python gets real embedding/NLP libraries", "TypeScript matches the SDKs it depends on", "Real network hops, real failure modes to handle"]}
          caption="Figure 3. The actual trade-off behind the four-service split."
        />
        <p>
          <strong>The database, concretely:</strong> one Postgres database, hosted on Neon (a
          serverless Postgres provider), with the `pgvector` extension enabling a native `vector`
          column type and a genuine HNSW (Hierarchical Navigable Small World) approximate-nearest-
          neighbor index, the same core algorithm a dedicated vector database like Pinecone uses
          internally. Two tables: `chunks` (`id`, `source`, `text`, `embedding vector(1024)`) is
          what every similarity search actually queries, via
          "SELECT id, source, text, 1 minus (embedding cosine-distance-operator query) AS score
          FROM chunks ORDER BY embedding cosine-distance-operator query LIMIT k" (the real operator
          is two characters, less-than then equals then greater-than, pgvector's own cosine-distance
          operator; written out in words here only so it doesn't look like a broken HTML tag).
          `documents` (`source`, `title`, `content`) holds each article's display title and full
          text, added during today's work (see "Recent work" below) specifically so the app never
          needs to read the original markdown files off disk at runtime.
        </p>
        <BranchFigure
          trunk={{ label: "Postgres + pgvector", sub: "hosted on Neon" }}
          branches={[
            { label: "chunks", sub: "text + embedding, searched" },
            { label: "documents", sub: "title + full content" },
          ]}
          caption="Figure 4. One database, two tables, each with a distinct job."
        />
        <p>
          <strong>Why Neon + pgvector over a dedicated vector database</strong> (Pinecone,
          Weaviate, Chroma, Qdrant): this app already needed a real relational database, so
          pgvector means one database technology to run and secure instead of two. At this app's
          actual data volume (a few dozen chunks across 7 knowledge-base articles), a dedicated
          vector database's extra scale headroom is simply irrelevant; a dedicated option would
          likely win at hundreds of millions of vectors, which this app will never have. Neon
          specifically because it has a genuine free tier and, critically, a pooled connection
          option (via PgBouncer) built for exactly the scenario Cloud Run creates: every Cloud Run
          instance opens its own independent connection pool (`backend/src/rag/vectorStore.ts`
          creates a `Pool` from the `pg` library, capped around 10 connections by default), and
          Cloud Run can scale `backend` out to multiple instances under real concurrent traffic,
          all competing for Neon's much smaller direct-connection ceiling if the pooled
          (`-pooler` in the hostname) connection string isn't used. I verified this concretely: 25
          concurrent requests against a database-backed endpoint all succeeded on the pooled
          connection string, after the same test would have risked exhausting the direct one.
        </p>
        <CompareFigure
          leftTitle="Dedicated vector DB"
          leftItems={["Wins at hundreds of millions of vectors", "One more system to run and secure", "Not needed at this app's real scale"]}
          rightTitle="Neon + pgvector (chosen)"
          rightItems={["One database technology, not two", "Real HNSW index, same core algorithm", "Free tier + pooled connections for Cloud Run"]}
          caption="Figure 5. The honest trade-off, not a claim that pgvector is strictly better."
        />
        <p>
          <strong>Why Claude specifically, and how the choice is actually enforced in code:</strong>{" "}
          `backend/src/llm/types.ts` defines a tiny, provider-agnostic interface, `LLMClient`, with
          exactly two methods: `chat()` (a plain question-in, answer-out call) and `step()` (one
          turn of a tool-calling loop). `backend/src/llm/anthropicClient.ts` is the only file that
          actually imports the Anthropic SDK and implements that interface against Claude.
          Switching providers would mean writing one more file implementing the same two methods;
          nothing else in the app would need to change, because every route talks to the
          interface, never to the SDK directly. Claude was picked partly because MCP (the protocol
          behind Chapter 4's agent and `mcp-server/`) was itself designed by Anthropic, keeping the
          "real protocol, not a simulation" claim consistent end to end.
        </p>
        <BranchFigure
          trunk={{ label: "LLMClient interface", sub: "chat() and step()" }}
          branches={[
            { label: "AnthropicLLMClient", sub: "real Claude" },
            { label: "MockLLMClient", sub: "offline stand-in" },
          ]}
          caption="Figure 6. Every route talks to the interface; swapping providers means writing one more implementation."
        />
        <p>
          <strong>Real APIs over from-scratch algorithms, and exactly what changed:</strong> two
          things used to be hand-built and are now real API calls. First, tokenization: Chapter 1
          used to run a hand-written byte-pair-encoding (BPE) tokenizer, a real, correct
          implementation of the actual algorithm, but its token boundaries never exactly matched
          Claude's real tokenizer, so the dollar-cost figure shown next to it was technically wrong
          for the very model it named. `backend/src/routes/tokenizer.route.ts` now calls
          Anthropic's own `/v1/messages/count_tokens` endpoint directly (via the SDK's
          `anthropic.beta.messages.countTokens()`, still under the SDK's beta namespace as of
          version 0.32.x even though the endpoint itself is stable), so the count is exactly right
          for whichever model `ANTHROPIC_MODEL` is set to. Second, embeddings: a from-scratch
          deterministic hashing ("bag of words") scheme used to stand in for a real embedding
          model; `python-service/app/embeddings.py` now calls Voyage AI's real `voyage-4-lite`
          model (1024-dimensional output, chosen specifically with
          `output_dimension=EMBEDDING_DIMS` since that number has to match the width of the
          pgvector column exactly). What deliberately stayed hand-built: the calculator tool (a
          real recursive-descent parser in `backend/src/agent/tools.ts`, not `eval()`, since its
          input ultimately comes from model output and could otherwise run arbitrary JavaScript),
          TextRank summarization, keyword extraction, readability scoring and the ROUGE-L eval
          metric, kept because building them by hand correctly is itself the point of that part of
          the demo, not a limitation to work around.
        </p>
        <CompareFigure
          leftTitle="Replaced with real APIs"
          leftItems={["Tokenizer → Claude's count_tokens", "Hashing embedding → Voyage voyage-4-lite"]}
          rightTitle="Deliberately kept hand-built"
          rightItems={["Calculator (security: no eval())", "TextRank, keywords, readability, ROUGE-L"]}
          caption="Figure 7. What moved to a real API, and what stayed hand-built on purpose."
        />

        <h2 id="stack" className="font-display text-lg font-bold text-paper-ink scroll-mt-20">
          Full tech stack, and exactly what each piece is for
        </h2>
        <p>
          Every real technology in this app, grouped by which service uses it, with what it's
          actually doing, not just its name.
        </p>
        <p>
          <strong>Frontend (`frontend/`):</strong> <strong>Next.js 14</strong> (App Router) is the
          React framework the whole site is built with; it turns each folder under `frontend/app/`
          into a real URL automatically (file-based routing), so a chapter is just a folder, no
          separate routing configuration to keep in sync. <strong>React 18</strong> is the
          underlying library Next.js is built on, the thing actually responsible for turning data
          into on-screen UI and updating just the parts that changed when that data changes.{" "}
          <strong>TypeScript</strong> is JavaScript with a type-checking layer added on top; it
          catches a whole category of bugs (like sending the wrong shape of data to a function)
          before the code ever runs, just by analyzing the code itself. <strong>Tailwind CSS</strong>{" "}
          is how every visual style (the paper color, the serif font, spacing) is written, as small
          utility classes directly in the markup, rather than separate stylesheet files.
        </p>
        <BranchFigure
          trunk={{ label: "Frontend stack" }}
          branches={[
            { label: "Next.js 14" },
            { label: "React 18" },
            { label: "TypeScript" },
            { label: "Tailwind CSS" },
          ]}
          caption="Figure 8. Every real library behind the pages you see."
        />
        <p>
          <strong>Backend (`backend/`):</strong> <strong>Node.js</strong> is the program that lets
          JavaScript/TypeScript run outside of a browser, as a real standalone server.{" "}
          <strong>Express</strong> is a small framework on top of Node.js specifically for handling
          incoming web requests: matching an incoming URL like `/api/rag/query` to the right
          function, parsing the request body, and sending a response back. The{" "}
          <strong>Anthropic SDK</strong> (`@anthropic-ai/sdk`) is the official library for calling
          Claude; it's the only thing in the whole app that actually talks to Anthropic's API
          directly. The <strong>Model Context Protocol SDK</strong>{" "}
          (`@modelcontextprotocol/sdk`) provides both the client half (used by `mcpClient.ts` to
          talk to `mcp-server`) and, in `mcp-server/`, the server half. <strong>LangChain</strong>{" "}
          (`@langchain/core`, `@langchain/anthropic`) and <strong>LangGraph</strong>{" "}
          (`@langchain/langgraph`) are used in exactly one place, the Chapter 11 explainer, to build
          a real multi-step graph-based AI workflow instead of a single prompt-and-response call.
        </p>
        <BranchFigure
          trunk={{ label: "Backend stack", sub: "Node.js + Express" }}
          branches={[
            { label: "Anthropic SDK" },
            { label: "MCP SDK" },
            { label: "LangChain" },
            { label: "LangGraph" },
          ]}
          caption="Figure 9. The orchestrator's own libraries, each with one specific job."
        />
        <p>
          <strong>Microservice (`python-service/`):</strong> <strong>Python</strong> itself, chosen
          because the libraries this service needs (Voyage AI's SDK, in particular) are written for
          Python. <strong>FastAPI</strong> is this service's equivalent of Express: it handles
          incoming web requests, but adds automatic request/response validation on top, using{" "}
          <strong>Pydantic</strong> (a library for describing exactly what shape of data a piece of
          Python code expects, and automatically rejecting anything that doesn't match).{" "}
          <strong>Uvicorn</strong> is the actual program that runs the FastAPI app and listens for
          real network connections; FastAPI itself is just code, Uvicorn is what makes it reachable.
          The <strong>voyageai</strong> package is Voyage AI's own official SDK, the only thing in
          the entire app that actually calls Voyage's API.
        </p>
        <BranchFigure
          trunk={{ label: "python-service stack", sub: "Python" }}
          branches={[
            { label: "FastAPI" },
            { label: "Pydantic" },
            { label: "Uvicorn" },
            { label: "voyageai" },
          ]}
          caption="Figure 10. The microservice's own libraries."
        />
        <p>
          <strong>Database, concretely, since this is worth being exact about:</strong>{" "}
          <strong>PostgreSQL</strong> ("Postgres") is the actual database software: a real,
          general-purpose relational database, the same category of software used by a huge share
          of real production companies, with no AI-specific behavior of its own at all. On top of
          plain Postgres, this project adds <strong>pgvector</strong>, which is a Postgres{" "}
          <strong>extension</strong> (an optional add-on module Postgres can load) that adds one
          new column type, `vector`, for storing a list of numbers efficiently, plus new SQL
          operators for comparing two vectors (this app uses pgvector's cosine-distance operator)
          and a special index type, <strong>HNSW</strong> (Hierarchical Navigable Small World), that
          makes "find the closest vectors to this one" fast even with many rows, by pre-building a
          multi-layered graph of shortcuts between similar vectors rather than comparing every row
          to every other row every time. Without pgvector, Postgres could still technically store a
          list of numbers in an ordinary column, but comparing them for similarity would mean
          pulling every single row into the application and scoring them one by one in JavaScript,
          correct but far slower at any real scale. <strong>Neon</strong> is simply who actually
          hosts the Postgres database for this project: a cloud company whose entire product is
          running Postgres databases for other people, so nobody has to install and maintain
          Postgres themselves on a physical server. The database holds exactly two tables,{" "}
          `chunks` (the searchable pieces of every knowledge-base article, each with its vector) and
          `documents` (each full article's title and complete text) — see "Exactly how each feature
          works" below for precisely how both are used together during a real RAG query.
        </p>
        <FlowFigure
          steps={[
            { label: "PostgreSQL", sub: "ordinary relational database" },
            { label: "+ pgvector extension", sub: "adds the vector column type + HNSW index" },
            { label: "hosted on Neon", sub: "so nobody runs a Postgres server by hand" },
          ]}
          caption="Figure 11. pgvector is a layer on top of plain Postgres, not a separate database."
        />
        <p>
          <strong>Other real external services called over the network:</strong>{" "}
          <strong>WeatherAPI.com</strong> is a real third-party weather data provider; the agent's
          `get_weather` tool makes a genuine HTTP call to it, no simulated data. <strong>Mermaid.js</strong>{" "}
          is a JavaScript library, running entirely in the browser, that turns a small text
          description (e.g. "box A points to box B") into an actual rendered diagram; it's what
          draws the Chapter 11 explainer's diagrams from the text Claude produces.
        </p>
        <BranchFigure
          trunk={{ label: "Called over the real network" }}
          branches={[
            { label: "WeatherAPI.com", sub: "live weather data" },
            { label: "Mermaid.js", sub: "renders diagrams, in-browser" },
          ]}
          caption="Figure 12. Two more real third-party dependencies, neither simulated."
        />
        <p>
          <strong>Infrastructure and deployment tooling:</strong> <strong>Docker</strong> packages
          each of the four services, with everything they need to run, into a single portable
          container image. <strong>Docker Compose</strong> starts several containers together with
          one command, used for local development only (it even runs a real Postgres container
          locally, separate from the production Neon database). <strong>Google Cloud Run</strong>,{" "}
          <strong>Google Artifact Registry</strong> and <strong>Google Secret Manager</strong>, plus{" "}
          <strong>GitHub Actions</strong>, are covered in full in the next section, since there's a
          lot of real, specific detail worth knowing there.
        </p>
        <PipelineFigure
          steps={[
            { label: "Docker", sub: "packages each service" },
            { label: "Docker Compose", sub: "local dev only" },
            { label: "Cloud Run + GitHub Actions", sub: "next section" },
          ]}
          caption="Figure 13. Local packaging on the left, real deployment on the right."
        />

        <CloudIllustration />
        <h2 id="gcp" className="font-display text-lg font-bold text-paper-ink scroll-mt-20">
          Google Cloud: the full deployment picture
        </h2>
        <p>
          <strong>What's actually running, and where:</strong> three separate{" "}
          <strong>Cloud Run</strong> services (Google's serverless container platform: you give it
          a container image, it runs it, gives it a real public web address, and automatically
          starts more copies under load or scales all the way down to zero, and zero cost, when
          nobody's using it): `ai-nexus` (the frontend, public), `ai-nexus-backend` (the Express
          API, public), and `ai-nexus-python` (the FastAPI microservice, deliberately{" "}
          <strong>not public</strong>, see the security model below). Container images for all
          three live in <strong>Artifact Registry</strong>, Google's own Docker image storage,
          inside one repository named `ai-nexus`. The database (Neon Postgres) is not a Google Cloud
          resource at all, it's a separate company, reached over the public internet from
          `ai-nexus-backend` using a connection string stored as a secret (below).
        </p>
        <BranchFigure
          trunk={{ label: "Google Cloud project" }}
          branches={[
            { label: "ai-nexus", sub: "frontend, public" },
            { label: "ai-nexus-backend", sub: "backend, public" },
            { label: "ai-nexus-python", sub: "private" },
          ]}
          caption="Figure 14. Three Cloud Run services; only one of them is deliberately not public."
        />
        <p>
          <strong>The security model between `backend` and `python-service`, exactly:</strong>{" "}
          `python-service` is deployed with `--no-allow-unauthenticated`, meaning Cloud Run itself
          refuses any request that doesn't carry valid proof of identity, before the request even
          reaches the actual Python code. Two things have to both be true for `backend` to be
          allowed through: first, an IAM policy binding grants `backend`'s underlying service
          account the `roles/run.invoker` role specifically on `ai-nexus-python` (a one-time
          `gcloud run services add-iam-policy-binding` command); second, every individual request
          `backend` sends has to carry a real, short-lived, Google-signed identity token proving who
          it is, which `backend/src/pythonServiceAuth.ts` fetches automatically from Cloud Run's own
          built-in metadata server and attaches as a Bearer token, with no manual configuration.
          Having the IAM role alone, without that per-request token, isn't enough, which is exactly
          the bug described in "Real bugs found in production" above: it's what made the very first
          deploy attempt fail with a misleading 404 instead of an honest 403.
        </p>
        <FlowFigure
          steps={[
            { label: "roles/run.invoker IAM grant", sub: "authorizes the caller" },
            { label: "+ a real ID token per request", sub: "proves identity" },
            { label: "= request allowed through", sub: "both required, not either" },
          ]}
          caption="Figure 15. Either one alone was the bug; both together is the fix."
        />
        <p>
          <strong>Secret Manager, exactly:</strong> four secrets exist, each a plain stored text
          value with its own access history: `postgres-url`, `anthropic-api-key`,
          `voyage-api-key` and `mcp-weather-api-key`. Cloud Run's default compute service account is
          explicitly granted the `roles/secretmanager.secretAccessor` IAM role (not automatic by
          default) so it's even allowed to read them, and each Cloud Run service declares which
          secrets it needs via a `--set-secrets` flag at deploy time (e.g.
          `POSTGRES_URL=postgres-url:latest`), which makes Cloud Run inject the secret's current
          value as a genuine environment variable inside the running container, the same as any
          other environment variable from the program's point of view, with the actual secret value
          never appearing in the deploy command, a log, or this repository itself.
        </p>
        <BranchFigure
          trunk={{ label: "Secret Manager" }}
          branches={[
            { label: "postgres-url" },
            { label: "anthropic-api-key" },
            { label: "voyage-api-key" },
            { label: "mcp-weather-api-key" },
          ]}
          caption="Figure 16. Four stored values; never typed into a Dockerfile or committed to git."
        />
        <p>
          <strong>CI/CD, exactly:</strong> `.github/workflows/deploy.yml` runs automatically on
          every push to `main`. It builds fresh Docker images for `python-service`, `backend` and
          `frontend` (in that order, since `backend` needs `python-service`'s address and `frontend`
          needs `backend`'s), tags each image with the full git commit SHA rather than a reused
          `:latest` tag (specifically so every past deploy stays individually pullable, making a
          rollback as simple as redeploying an old, still-existing tag instead of hoping a fresh
          rebuild happens to match what used to run), pushes them to Artifact Registry, and
          redeploys each Cloud Run service onto its new image.
        </p>
        <PipelineFigure
          steps={[
            { label: "python-service", sub: "built + deployed first" },
            { label: "backend", sub: "needs its address" },
            { label: "frontend", sub: "needs backend's address" },
          ]}
          caption="Figure 17. Deploy order is forced by which service needs which address."
        />
        <p>
          <strong>How the workflow authenticates to Google Cloud, and why it matters:</strong>{" "}
          instead of a downloadable service account JSON key pasted into a GitHub secret (a
          long-lived credential that keeps working forever if it's ever leaked), this project uses{" "}
          <strong>Workload Identity Federation</strong> (WIF). Concretely: a dedicated, narrowly-
          scoped service account (`github-actions-deployer`, with exactly three IAM roles:
          `roles/run.admin` to deploy, `roles/artifactregistry.writer` to push images, and
          `roles/iam.serviceAccountUser` to act as the runtime identity) exists only for this
          purpose. A Workload Identity Pool and an OIDC provider are configured to trust GitHub's
          own token issuer, restricted with an `--attribute-condition` so only workflow runs from
          this exact repository (`Karti722/ai-nexus`) are ever trusted, not just any GitHub repo.
          On every run, GitHub itself signs a short-lived token proving "this really is a workflow
          run from that exact repo," and the workflow's `id-token: write` permission is what lets it
          request that token at all; GCP verifies it against the trust relationship and hands back
          temporary credentials scoped to the one service account above, with nothing long-lived
          ever stored anywhere. If this repository were ever compromised, there's no static
          credential to rotate or revoke, because none exists.
        </p>
        <CompareFigure
          leftTitle="Downloadable JSON key"
          leftItems={["A real, long-lived credential file", "Works forever if ever leaked", "The old, more common approach"]}
          rightTitle="Workload Identity Federation (chosen)"
          rightItems={["Nothing downloadable exists at all", "A short-lived token per run", "Scoped to this exact repo only"]}
          caption="Figure 18. No static credential anywhere, by design."
        />
        <p>
          <strong>The custom domain:</strong> the live site at ai-nexus-textbook.com isn't Cloud
          Run's own address, Cloud Run gives every service an auto-generated `.run.app` address for
          free; a custom domain is a separate, optional step (`gcloud beta run domain-mappings
          create`) that maps a real, purchased domain onto the `ai-nexus` Cloud Run service, with
          Google automatically issuing and managing the HTTPS certificate for it. The original
          `.run.app` address keeps working the entire time too, a domain mapping adds a second
          address rather than replacing the first.
        </p>
        <FlowFigure
          steps={[
            { label: "ai-nexus-xxxx.run.app", sub: "free, auto-generated, keeps working" },
            { label: "+ domain mapping", sub: "gcloud beta run domain-mappings" },
            { label: "ai-nexus-textbook.com", sub: "Google manages the HTTPS cert" },
          ]}
          caption="Figure 19. A second address added, not a replacement for the first."
        />
        <p>
          <strong>Why this entire setup costs $0/month to run:</strong> Cloud Run's standing free
          tier (2,000,000 requests and roughly 180,000 vCPU-seconds a month) comfortably covers
          real but modest demo/portfolio traffic; Neon's free tier covers the database; Voyage AI's
          200-million-free-token allowance comfortably covers this app's entire realistic embedding
          usage; WeatherAPI's free tier (100,000 calls/month) covers the weather tool. Scale-to-zero
          is what actually makes the "free" part real rather than theoretical: an idle Cloud Run
          service, and an idle Neon database, genuinely cost nothing while nobody's using them,
          which is also why the very first request after a quiet period is noticeably slower (a
          "cold start"), the trade-off that makes $0/month possible at all. The only genuine ongoing
          cost is Anthropic's own small pay-as-you-go usage pricing for whatever the deployed app is
          actually asked, a usage cost from Anthropic directly, not a hosting cost from Google.
        </p>
        <BranchFigure
          trunk={{ label: "Free-tier hosting", sub: "$0/month" }}
          branches={[
            { label: "Cloud Run free tier" },
            { label: "Neon free tier" },
            { label: "Voyage free tier" },
            { label: "WeatherAPI free tier" },
          ]}
          caption="Figure 20. Only Anthropic usage costs real money, and that's usage, not hosting."
        />

        <h2 id="mechanisms" className="font-display text-lg font-bold text-paper-ink scroll-mt-20">
          Exactly how each feature works, step by step
        </h2>
        <p>
          This section exists so you never have to open the actual source to explain a feature
          correctly. Each one names the real files and the real sequence of calls. Use the
          floating switch in the corner to read every explanation below in plain, beginner-
          friendly language instead, if that's more useful to you right now.
        </p>
        <ExplainModeProvider>
          <Explanation
            technical={
              <p>
                <strong>RAG (Chapter 3, `/rag`):</strong> a question is typed in and POSTed to
                `/api/rag/query` (`backend/src/routes/rag.route.ts`). The route calls
                `embedTexts()` (`backend/src/rag/embeddingsClient.ts`), which makes an HTTP POST to
                python-service's `/embed` endpoint, which calls Voyage AI and returns a
                1024-number vector for the question. That vector goes into `vectorStore.ts`'s
                `searchSimilar()`, which runs the SQL query named above and returns the top 4
                closest chunks by cosine similarity. Those 4 chunks get numbered and inserted into
                a prompt template, `buildRagPrompt()` (`backend/src/prompts/systemPrompts.ts`),
                which explicitly instructs Claude: answer only from these numbered passages, cite
                them as bracketed numbers, and say so explicitly if the answer isn't in the
                context, never use outside knowledge. That full prompt plus the question goes to
                `anthropicClient.chat()`, and the real Claude answer comes back and is returned to
                the frontend alongside the 4 source chunks (their file name, title pulled from the
                `documents` table, the chunk text, and the similarity score), which is what renders
                as numbered citation cards under the answer.
              </p>
            }
            beginner={
              <p>
                <strong>RAG (Chapter 3, `/rag`), simply:</strong> "RAG" stands for
                Retrieval-Augmented Generation, which just means "look things up, then write an
                answer using what you found," instead of an AI trying to answer purely from
                memory. Here's the whole thing, step by step: you type a question, like "what is
                MCP?" First, the app turns your question into a list of numbers that captures its
                meaning (this is called an "embedding," think of it as plotting your question as a
                point on a map, where similar meanings end up near each other). Next, it asks the
                database, which already has every article on this site stored the same way, as
                points on that same map, for whichever 4 stored passages are plotted closest to
                your question. Think of it like a librarian who's already organized every book by
                topic, so instead of reading the whole library, you can go straight to the 4 most
                relevant pages. Then, the app hands Claude those 4 real passages along with a
                strict rule: "only answer using these passages, and tell me exactly which one each
                part of your answer came from, and if the answer genuinely isn't in these
                passages, say so instead of guessing." Finally, Claude's real, original answer
                comes back along with the 4 passages it was actually given, and both get shown to
                you on the page, the numbered passages are what let you click through and verify
                the answer is actually grounded in something real, not invented.
              </p>
            }
          />
          <PipelineFigure
            steps={[
              { label: "embed question" },
              { label: "search chunks" },
              { label: "4 closest" },
              { label: "Claude answers" },
            ]}
            caption="Figure 21. RAG: retrieve real passages first, generate an answer from them second."
          />
          <Explanation
            technical={
              <p>
                <strong>The AI agent (Chapter 4, `/agent`):</strong> `agentLoop.ts`'s
                `runAgent()` function starts a transcript with just the user's message, then loops
                up to 4 times (`MAX_STEPS = 4`, a hard safety cap against an infinite loop). Each
                iteration calls `anthropicClient.step()`, passing the whole transcript so far plus
                the list of available tools (always `calculator` and `search_knowledge_base`;
                also every tool the MCP server exposes, if the request's `useMcp` flag is true).
                Claude's response is checked: if it's a `tool_use` content block, the matching
                tool actually runs (`executeTool()` in `agentLoop.ts` checks local tools first,
                then falls through to `callMcpTool()` for anything else), and the real result is
                appended to the transcript as a new turn before looping again. If Claude's
                response is plain text instead, that's treated as the final answer and the loop
                stops immediately, even on the very first iteration if no tool was needed. Every
                step (which tool, what input, what it returned, and the final text) is collected
                into a `trace` array returned to the frontend, which is what renders as the
                step-by-step "Reasoning trace" timeline you see on the page.
              </p>
            }
            beginner={
              <p>
                <strong>The AI agent (Chapter 4, `/agent`), simply:</strong> a normal chatbot can
                only talk, it can't actually do anything. An "agent" is an AI that's allowed to
                take real actions along the way to answering you. Here, before Claude gives you a
                final answer, it's allowed to say "wait, I should use a tool for this part." For
                example, if you ask "what's 15% of 340?," instead of trying to do that math in its
                head (which AI models are genuinely bad at), it says "let me use the calculator,"
                and the app actually runs a real calculator function and gets back the real exact
                answer, 51. If you ask about the weather, it can ask a real weather tool for the
                real current temperature instead of making one up. Claude sees that real result,
                and then decides again: is that enough to answer now, or do I need another tool?
                This "think, act, check the result, think again" cycle can repeat up to 4 times;
                after that, the app forces a final answer no matter what, specifically so it can
                never get stuck looping forever. Every single step along the way, which tool was
                used, what was asked of it, and what it actually returned, is shown to you as a
                visible timeline, so you can watch the AI's reasoning happen instead of only seeing
                the final answer.
              </p>
            }
          />
          <FlowFigure
            steps={[
              { label: "Claude decides" },
              { label: "run a real tool", sub: "or skip straight to an answer" },
              { label: "feed result back", sub: "loop again, up to 4 times" },
            ]}
            caption="Figure 22. The agent's think → act → observe loop."
          />
          <Explanation
            technical={
              <p>
                <strong>MCP, concretely:</strong> `mcp-server/src/index.ts` is a completely
                separate Node program. It never imports anything from `backend/`, and it never
                runs unless something spawns it. `backend/src/agent/mcpClient.ts`'s `connect()`
                function is that spawner: it calls Node's `child_process` machinery (via the MCP
                SDK's `StdioClientTransport`) with the current Node binary and the path to
                `mcp-server/dist/index.js`, explicitly forwarding the *entire* parent environment
                ({"`env: { ...process.env }`"}), which matters because the SDK's default behavior
                is to pass only a small safe allowlist of environment variables to the child
                process, which would silently drop `MCP_WEATHER_API_KEY` and break the weather
                tool with no obvious error. Once connected, `getMcpTools()` calls the SDK's
                `listTools()`, which sends a real JSON-RPC request over stdin and gets back the 3
                tools `mcp-server` declares (`get_current_time`, `get_weather`,
                `list_ai_concepts`) with their JSON-Schema input definitions. Calling one
                (`callMcpTool()`) sends a `callTool` JSON-RPC request the same way; for
                `get_weather`, `mcp-server/src/index.ts` makes a real `fetch()` call to
                `api.weatherapi.com` and returns the live temperature, condition and humidity as
                plain text back over stdout. If the MCP server hasn't been built yet (`npm run
                build:mcp`), `connect()` catches the failure and returns `null`; every caller
                treats that as "no MCP tools available" rather than crashing, so the rest of the
                agent demo still works with just the two local tools.
              </p>
            }
            beginner={
              <p>
                <strong>MCP, simply:</strong> "MCP" stands for Model Context Protocol, and it's a
                standard way for an AI to reach real tools. Here's the concrete picture: when the
                backend starts up, it launches a second, completely separate little program on the
                very same computer, almost like opening a second app. The two programs don't talk
                over the internet; they pass messages directly back and forth, the way you'd slide
                notes under a door to someone in the next room. That second program only knows how
                to do three specific things: tell you the current time, look up real weather for a
                city, and list the topics this app covers. The first thing the backend does is ask
                it "what can you do?," and gets back that list of three options with a description
                of each. Later, when the agent (above) decides it needs, say, real weather, the
                backend asks that second program to actually do it, and gets a real answer handed
                back the same way, through those same passed notes. The reason this matters: a tool
                built this way isn't locked to this one app, the exact same little weather-and-time
                program could be plugged into a completely different AI assistant without changing
                a single line of it, because both sides agreed to speak MCP.
              </p>
            }
          />
          <BranchFigure
            trunk={{ label: "backend", sub: "spawns a child process" }}
            branches={[
              { label: "get_current_time" },
              { label: "get_weather", sub: "real API call" },
              { label: "list_ai_concepts" },
            ]}
            caption="Figure 23. mcp-server runs as its own program, reached over stdin/stdout, not HTTP."
          />
        <Explanation
          technical={
            <p>
              <strong>The LangGraph explainer (Chapter 11, `/langgraph` and `/explain`):</strong>{" "}
              `backend/src/explainer/buildAndRun.ts`'s `explainApp()` function builds a LangGraph
              `StateGraph` with exactly three nodes wired in a fixed line: start, then `retrieve`,
              then `diagram`, then `explain`, then end — never a loop, never a branch. `retrieve`
              runs the exact same `embedTexts()` plus `searchSimilar()` calls RAG uses above, just
              asking for the top 5 chunks instead of 4. `diagram` sends those chunks to Claude
              (through LangChain's own `ChatAnthropic` wrapper around the Anthropic SDK, a
              different code path than `anthropicClient.ts` uses) with an instruction to respond
              in an exact two-part format: a line starting "CAPTION:" with one sentence describing
              what the diagram will show, then a line starting "DIAGRAM:" followed by real
              Mermaid.js diagram syntax (e.g. `flowchart TD` and a series of boxes and arrows as
              plain text). A function called `extractCaptionAndMermaid()` splits that response
              apart with a couple of regular expressions. Critically, the model never outputs
              pixel coordinates or picks where a box goes on screen: Mermaid.js, running in the
              browser (`frontend/components/AppExplainer.tsx`), is the thing that actually lays
              out and draws the diagram from that text, the same separation of "the model writes
              structured text, a deterministic renderer draws it" that Claude and ChatGPT
              themselves use internally when asked to draw something. `explain` then asks Claude
              for a plain written explanation from the same retrieved chunks. The one library
              quirk worth knowing: LangChain's Claude wrapper has a hardcoded list of model names
              for which it knows to omit an internal setting called `top_p`, and that list
              predates `claude-sonnet-5`, so without a fix it would send an invalid value the real
              Claude API rejects outright; the fix is one line forcing that property to `undefined`
              directly on the already-built model object, since the constructor's own options have
              no setting that produces the correct behavior for a model outside that hardcoded
              list.
            </p>
          }
          beginner={
            <p>
              <strong>The LangGraph explainer (Chapter 11, `/langgraph` and `/explain`), simply:</strong>{" "}
              this feature lets you ask any question about how this very app works, like "how does
              the agent decide to use a tool?," and get back both a real diagram and a real written
              explanation, generated fresh for your exact question. Unlike the agent above, which
              decides its own steps as it goes, this always does the same three things in the exact
              same order, which is why a different, simpler tool (not the agent-building one) is
              used for it: first, it looks up real passages about the app, the same lookup-by-
              meaning trick RAG uses above. Second, it asks Claude to describe a diagram using plain
              text instructions, like a recipe: "draw a box labeled Frontend, draw a box labeled
              Backend, draw an arrow between them." Claude never decides where on the screen
              anything actually goes; a separate drawing program reads that text recipe and turns it
              into an actual picture with boxes and arrows, the same way a reliable way to get a
              computer to draw something is to describe it precisely in words rather than ask it to
              control a paintbrush directly. Third, Claude writes a plain written explanation to go
              alongside the picture, using the same real passages from step one. All three steps use
              the real knowledge about this app, so the diagram and explanation can't describe a
              feature or a file that doesn't actually exist.
            </p>
          }
        />
        <PipelineFigure
          steps={[
            { label: "retrieve" },
            { label: "diagram", sub: "text, not pixels" },
            { label: "explain" },
          ]}
          caption="Figure 24. A fixed, three-step pipeline, never a loop, unlike the agent above."
        />
        <Explanation
          technical={
            <p>
              <strong>Mock mode, exactly:</strong> `backend/src/config.ts` has a getter,
              `isMockMode`, that's simply `true` whenever `ANTHROPIC_API_KEY` is an empty string.
              `backend/src/llm/index.ts` reads that once, at startup, and exports either a real
              `AnthropicLLMClient` or a `MockLLMClient` as the one `llmClient` every route
              imports; no route ever checks the mode itself. `MockLLMClient`
              (`backend/src/llm/mockLLM.ts`) is genuinely deterministic, not random: for `chat()`
              it echoes the question back inside a canned, clearly-labeled "[MOCK MODE]" paragraph
              explaining what a real call would have done; for the agent's `step()` it uses plain
              regular expressions (a pattern that matches a math expression, a pattern that
              matches "N% of M") to decide which tool a real Claude call would plausibly have
              picked, so the full think-act-observe loop still runs and still looks real, with
              only the actual model reasoning replaced by canned text. Every mocked response is
              labeled `"mock": true` in the JSON the frontend receives, specifically so a canned
              reply is never mistaken for a real one.
            </p>
          }
          beginner={
            <p>
              <strong>Mock mode, simply:</strong> real calls to Claude cost real money, so this app
              has a free fallback for anyone trying it out without setting up billing first. If no
              real API key has been configured, the app doesn't break or show an error, it quietly
              switches every "ask Claude" step over to a stand-in that fakes a plausible-looking
              answer using simple, hand-written rules instead of real intelligence (for example, if
              your message contains a math expression, the stand-in just guesses you probably
              wanted the calculator tool, the same way the agent would really decide, just without
              a real brain behind the decision). Every single one of these fake answers is clearly
              labeled "[MOCK MODE]" right in the text, specifically so nobody ever mistakes a fake
              answer for a real one. The important part: absolutely everything else, the routing,
              the real database, the real agent loop structure, still genuinely runs exactly as it
              would with real money being spent, only the one specific step of "an actual
              intelligent model thinks of the words" is swapped out.
            </p>
          }
        />
        <CompareFigure
          leftTitle="Real mode"
          leftItems={["ANTHROPIC_API_KEY is set", "Real Claude answers"]}
          rightTitle="Mock mode"
          rightItems={["No API key set", "Canned, clearly-labeled replies"]}
          caption="Figure 25. One getter decides which client every route actually uses."
        />
        <Explanation
          technical={
            <p>
              <strong>Embeddings and vector similarity, the actual math, in plain terms:</strong>{" "}
              an embedding model turns a piece of text into a fixed-length list of numbers (here,
              1024 of them) such that pieces of text with similar *meaning* produce lists of
              numbers that point in a similar *direction*, thought of as a point in
              1024-dimensional space. "How similar are two pieces of text" becomes "how close
              together, direction-wise, are their two points," measured with{" "}
              <strong>cosine similarity</strong>: mathematically, the cosine of the angle between
              the two vectors, which conveniently always comes out between negative one (opposite
              meaning) and one (identical meaning), regardless of how long either piece of text
              was, since the calculation only cares about direction, not magnitude. Computed, it's
              just the dot product of the two vectors divided by the product of their lengths;
              Voyage's embeddings already come out as unit-length vectors (length exactly one),
              which is why several files in this app (`summarizer.py`, `eval.py`,
              `semantic_cache.py`) compute a plain dot product directly and call it the cosine
              similarity, skipping the division entirely since dividing by one changes nothing.
              pgvector's HNSW index exists specifically to avoid computing that comparison against
              every single stored row one at a time: it pre-builds a navigable graph connecting
              similar vectors to each other, so a search can jump straight toward the right
              neighborhood instead of scanning everything, trading a tiny amount of accuracy (it's
              *approximate* nearest-neighbor, not guaranteed-exact) for a large speed advantage
              that matters once there are many more rows than this app actually has.
            </p>
          }
          beginner={
            <p>
              <strong>Embeddings and vector similarity, simply:</strong> imagine every sentence as
              a single dot placed somewhere on a huge map, where sentences that mean similar things
              get placed near each other and sentences about completely different things end up far
              apart, regardless of whether they happen to share any of the same words. For example,
              "the cat sat on the mat" and "a feline rested on the rug" would land close together on
              this map, even though they don't share a single important word, because they mean the
              same thing. "How similar are two sentences" then just becomes a simple geography
              question: "how close together are their two dots on the map?" That closeness number
              is what this app calls a similarity score, and the process of turning a sentence into
              a dot's exact position is called "embedding" it. Everything else described in the
              technical version, the exact math for measuring "close" fairly and a shortcut index so
              the computer doesn't have to check every single dot one at a time, is really just the
              engineering needed to make that simple idea fast and accurate at real scale.
            </p>
          }
        />
        <FlowFigure
          steps={[
            { label: "text" },
            { label: "1024 numbers", sub: "a point in space" },
            { label: "cosine similarity", sub: "how close two points are" },
          ]}
          caption="Figure 26. An embedding turns meaning into a point; similarity is just distance."
        />
        <Explanation
          technical={
            <p>
              <strong>Why embedding a "document" and a "query" aren't treated identically:</strong>{" "}
              Voyage's API accepts an optional `input_type` of `"document"` or `"query"`, and this
              app passes `"document"` when embedding knowledge-base chunks at seed time and
              `"query"` when embedding a live question (`embeddingsClient.ts`'s `embedTexts()`
              threads this through everywhere; `semantic_cache.py`'s cache comparisons and
              `eval.py`'s candidate-vs-reference comparison deliberately omit it, since those are
              symmetric, two-things-of-the-same-kind comparisons, not a short question searching
              through long reference passages). The model was trained knowing a short question and
              the long passage that answers it don't look like naturally identical sentences even
              when they're a perfect semantic match, so it nudges the two embedding types slightly
              to compensate, measurably improving retrieval quality over treating every embedding
              identically.
            </p>
          }
          beginner={
            <p>
              <strong>Document vs. query embeddings, simply:</strong> here's the subtle problem this
              solves: a short question like "what is MCP?" and the long paragraph that correctly
              answers it don't naturally "look" alike as plain text, a question and its answer are
              different shapes of writing, even when the answer is a perfect match. If you treated
              them identically, a genuinely perfect match could end up scoring lower than it should,
              just because a question and an answer are worded so differently. So, every time this
              app embeds some text, it also tells Voyage's model which role that text is playing:
              "this is a question someone is asking" or "this is a reference passage that might
              contain an answer." The model was specifically trained to account for that difference,
              so it nudges its math slightly to compensate, meaning a genuinely good match between a
              question and its answer still scores as a good match, instead of being unfairly
              penalized just for being phrased differently.
            </p>
          }
        />
        <CompareFigure
          leftTitle="input_type: document"
          leftItems={["Used for knowledge-base chunks", "Embedded once, at seed time"]}
          rightTitle="input_type: query"
          rightItems={["Used for a live question", "Embedded fresh, every request"]}
          caption="Figure 27. Asymmetric embedding, for a short question matched against long passages."
        />
        <Explanation
          technical={
            <p>
              <strong>Why chunks are 600 characters with 100 characters of overlap, specifically:</strong>{" "}
              `chunker.ts`'s `chunkText()` splits an article on blank lines (paragraph boundaries)
              and packs paragraphs together until adding the next one would exceed 600 characters,
              then starts a new chunk, carrying over the last 100 characters of the previous chunk
              as context so a sentence or idea that happens to fall right at a chunk boundary isn't
              cut off from its context, a standard technique in real retrieval systems. Small
              enough that a retrieved chunk is specific rather than dragging in a whole article's
              worth of unrelated sentences, large enough to usually contain a complete thought
              rather than a fragment.
            </p>
          }
          beginner={
            <p>
              <strong>Why articles get cut into small pieces, simply:</strong> imagine trying to
              answer "what is MCP?" by handing someone an entire 10-page article and saying "the
              answer is in there somewhere." That's technically true but not very useful, a short,
              focused paragraph would answer the question much better. That's why, before anything
              gets stored, every article on this site is sliced into short pieces (around 600
              characters each, roughly a short paragraph) so that each piece is small enough to be
              about one specific idea, and searching can hand back just the relevant piece instead
              of a whole article. There's one more detail: a little bit of the end of each piece
              (about 100 characters) is copied onto the start of the next piece, like overlapping
              roof shingles. Without that overlap, an idea that happens to fall right at the exact
              cut point between two pieces could lose its surrounding context and become confusing
              on its own; the small overlap makes sure that never happens.
            </p>
          }
        />
        <FlowFigure
          steps={[
            { label: "article" },
            { label: "paragraphs" },
            { label: "~600-char chunks", sub: "100-char overlap" },
          ]}
          caption="Figure 28. Small enough to be specific, large enough to hold a complete thought."
        />
        <Explanation
          technical={
            <p>
              <strong>Tokenization, explained precisely:</strong> an AI model doesn't read letters
              or whole words directly, it reads <strong>tokens</strong>, sub-word pieces decided in
              advance by the model's own vocabulary (a common word might be one token; a rarer or
              longer word might be split into two or three). This matters for two real reasons:
              Claude's API pricing is quoted per token, not per character or per word, and a
              model's context window (the most it can read or remember in one request) is also
              measured in tokens. `backend/src/routes/tokenizer.route.ts` asks Claude's own real
              counting endpoint for the exact token count of whatever text you type, rather than
              estimating from word or character count (a common rough rule of thumb is "about 4
              characters per token" in English, but that's only an approximation; the real count
              depends on the model's actual vocabulary and genuinely varies by language and
              content), then multiplies that exact count by a published per-million-token price to
              show a real dollar estimate.
            </p>
          }
          beginner={
            <p>
              <strong>Tokenization, simply:</strong> you might expect an AI model to charge by the
              letter, the word, or the sentence, but it actually charges by something called a
              "token," a small chunk of a word that the model was trained to recognize as one unit.
              A common short word like "the" is usually its own single token, but a longer or rarer
              word might get split into two or three tokens the model treats separately. This isn't
              just trivia, it directly affects two real things: how much a request actually costs in
              dollars, since Claude's pricing is set per token, and how much text a model can read or
              remember at once, since that limit is also measured in tokens, not characters. Rather
              than guess using a rough rule of thumb like "about 4 characters per token" (a real
              approximation people do use, but an approximation), this app asks Claude's own real
              counting system for the exact number for whatever text you type, then multiplies that
              exact number by the real published price per token to show you a genuinely accurate
              dollar estimate, not a rough guess.
            </p>
          }
        />
        <BadgeFigure
          glyph="¢"
          label="Tokens, not characters"
          caption="pricing and context limits are both measured in tokens, so an exact count matters."
        />
        <Explanation
          technical={
            <p>
              <strong>Semantic caching's actual threshold mechanism:</strong>{" "}
              `semantic_cache.py`'s `run_cache_simulation()` keeps a plain in-memory list of every
              query seen so far, each with its embedding. For a new query, it compares that
              query's embedding against every cached one, keeps whichever had the single highest
              cosine similarity, and calls it a cache "hit" only if that highest similarity is at
              or above a threshold (the demo defaults to 0.85, a genuinely high bar: two sentences
              have to be very close in meaning, not just on the same general topic, to count).
              Below that threshold, it's a "miss" and the new query itself gets added to the cache
              for future comparisons. In a real production system, a cache hit means skipping the
              expensive model call entirely and reusing the previous answer, at whatever the
              per-token price happens to be; this demo stops at showing the hit/miss decision and
              similarity score, it doesn't also replay a previously cached *answer*.
            </p>
          }
          beginner={
            <p>
              <strong>Semantic caching, simply:</strong> imagine two different people asking "what
              is retrieval-augmented generation?" and "can you explain RAG to me?" Those are worded
              completely differently, but they're really the exact same question. A normal cache
              that only checks for identical text would treat these as two unrelated requests and
              pay for two separate AI calls; this app's cache instead compares what the questions
              actually *mean* (using the same embedding trick described above) and can recognize
              that they're close enough to reuse the same answer, skipping a brand-new, paid AI call
              entirely for the second person. The bar for "close enough" here is genuinely strict,
              set at a similarity of 0.85 out of a possible 1.0, specifically so two questions that
              are merely on the same general topic, but not actually asking the same thing, don't
              get incorrectly treated as identical and given someone else's answer.
            </p>
          }
        />
        <FlowFigure
          steps={[
            { label: "new query" },
            { label: "compare to cache", sub: "cosine similarity" },
            { label: "≥ 0.85 = hit, else miss" },
          ]}
          caption="Figure 29. A real cost-saving technique production AI systems lean on heavily."
        />
        <Explanation
          technical={
            <p>
              <strong>TextRank, the actual algorithm, not just the name:</strong>{" "}
              `python-service/app/summarizer.py` implements a real, from-scratch version of the
              algorithm behind TextRank (Mihalcea & Tarau, 2004), which itself adapts Google's
              original PageRank (the algorithm that originally ranked web pages by how many other
              important pages link to them) to sentences instead of web pages. Every sentence in
              the input is embedded, and a similarity score is computed between every pair of
              sentences, forming a graph where sentences are nodes and their similarity is the
              strength of the edge between them (with self-similarity explicitly zeroed out first,
              a sentence doesn't get to vote for itself). Then, exactly like PageRank, the
              algorithm runs 30 rounds of a very simple update: each sentence's new score becomes a
              small fixed base amount plus 85% (the "damping factor") of the scores flowing in from
              every other sentence, weighted by how similar that other sentence is. A sentence
              that's similar to many other important sentences in the document ends up with a high
              score after enough rounds, the same reasoning PageRank uses for "a page linked to by
              many important pages is probably important too." The highest-scoring N sentences are
              then pulled out and put back in their original reading order, so the summary reads
              coherently rather than as a jumbled list. No AI model is involved in the ranking
              itself, only in producing the embeddings used to measure sentence similarity.
            </p>
          }
          beginner={
            <p>
              <strong>TextRank, simply:</strong> this is how the app picks out a document's most
              important sentences for a summary, without any AI model doing the actual picking, a
              completely different, non-AI approach than Chapter 11's explainer above. Here's the
              idea: every sentence in the document gets compared to every other sentence, and each
              one effectively "votes" for the sentences it's similar to. A sentence that lots of
              other sentences in the document are similar to is probably central to what the
              document is really about, the same way a web page that tons of other pages link to is
              probably an important page, which is literally the original idea Google used to rank
              search results decades ago, just applied to sentences inside one document instead of
              pages across the whole internet. The voting happens over and over, 30 rounds, each
              sentence's score gradually settling based on how much support it keeps getting from
              other important sentences. Once the voting settles, the handful of highest-scoring
              sentences are pulled out and put back in their original order, so the final summary
              reads as a coherent passage instead of a jumbled list of disconnected sentences.
            </p>
          }
        />
        <FlowFigure
          steps={[
            { label: "embed every sentence" },
            { label: "build a similarity graph" },
            { label: "30 rounds of voting", sub: "PageRank-style" },
            { label: "top sentences, original order" },
          ]}
          caption="Figure 30. TextRank: PageRank's idea, applied to sentences instead of web pages."
        />
        <Explanation
          technical={
            <p>
              <strong>ROUGE-L, the actual algorithm:</strong> `python-service/app/eval.py`
              implements the real longest-common-subsequence idea behind the ROUGE-L metric (Lin,
              2004), a standard, widely used summarization/translation evaluation metric. Both the
              candidate answer and the reference answer are split into words, and a classic
              dynamic-programming algorithm finds the longest sequence of words that appears in
              both, in the same relative order, though not necessarily consecutively (so "the cat
              sat on the mat" and "the small cat happily sat on a mat" share a long common
              subsequence even though neither is a direct substring of the other). That shared
              length is then turned into a precision score (what fraction of the candidate's words
              were part of that shared sequence) and a recall score (what fraction of the
              reference's words were), combined into one F1-style score, the harmonic mean of the
              two, so an answer can't score well by just being extremely long and padded with the
              right words.
            </p>
          }
          beginner={
            <p>
              <strong>ROUGE-L, simply:</strong> when you want to check, automatically, whether an
              AI's answer is actually close to a known-correct reference answer, you need some way to
              measure "closeness" as a real number instead of just eyeballing it. ROUGE-L does this
              by finding the longest stretch of words that both the AI's answer and the reference
              answer share, in the same relative order, even if other words are scattered in between
              them (so "the cat sat on the mat" and "the small cat happily sat on a mat" still count
              as sharing a long run: "the cat sat on * mat"). The bigger that shared run is, compared
              to the length of both answers, the higher the score. Importantly, this means an answer
              can't cheat by just being extremely long and stuffed with extra padding, since the
              score specifically checks how much of *both* answers the shared content actually
              covers, not just whether the right words appear somewhere in a wall of text.
            </p>
          }
        />
        <BadgeFigure
          glyph="≈"
          label="Longest common subsequence"
          caption="shared word order between candidate and reference, turned into one F1-style score."
        />
        <Explanation
          technical={
            <p>
              <strong>Flesch and Flesch-Kincaid readability, the actual formulas:</strong>{" "}
              `python-service/app/readability.py` computes two well-established 20th-century
              formulas from just three counts: the number of words, the number of sentences, and
              the number of syllables (approximated by counting groups of vowels per word, a
              heuristic that doesn't need a full pronunciation dictionary and is accurate enough
              for ordinary English prose). Flesch Reading Ease and the Flesch-Kincaid Grade Level
              both boil down to simple weighted combinations of "average words per sentence" and
              "average syllables per word," on the well-established premise that longer sentences
              built from longer, multi-syllable words are reliably harder to read, regardless of
              the specific topic.
            </p>
          }
          beginner={
            <p>
              <strong>Readability scoring, simply:</strong> this estimates how hard a piece of
              writing is to read, and produces an actual number for it, using nothing more than
              three simple counts: how many words, how many sentences, and roughly how many
              syllables are in the text. The idea behind it is just common sense, made precise: "The
              cat sat." is obviously easier to read than "The feline subsequently positioned itself
              in a seated posture," and the difference is really just shorter sentences built from
              shorter, simpler words. This app computes that score both before and after summarizing
              a piece of text, so you can see, as an actual number, whether the summary ended up
              easier or harder to read than the original, regardless of what the text was actually
              about.
            </p>
          }
        />
        <BadgeFigure
          glyph="Fx"
          label="Flesch-Kincaid"
          caption="words per sentence + syllables per word → a reading-difficulty score, no AI involved."
        />
        <Explanation
          technical={
            <p>
              <strong>MCP, the actual protocol, not just "a client and a server":</strong> the
              Model Context Protocol is a real, published specification (also designed by
              Anthropic) built on <strong>JSON-RPC 2.0</strong>, a standard, minimal format for
              "call a named function with these arguments, get back this result or this error"
              messages, that's deliberately independent of how those messages are physically
              delivered. This app's `mcp-server` uses the stdio transport (messages sent as lines
              of JSON over the child process's standard input and output), but the same protocol
              also supports other transports (like one based on HTTP with Server-Sent Events) for
              a server that isn't a local child process. The protocol defines three kinds of thing
              a server can expose: <strong>tools</strong> (callable functions, what this app
              uses), <strong>resources</strong> (readable data, like a file or a database row),
              and <strong>prompts</strong> (reusable prompt templates); this app's `mcp-server`
              only implements tools. The entire point of standardizing this is reuse without custom
              integration work: the exact same `mcp-server` process, unmodified, could be plugged
              into Claude Desktop, Claude Code, or a completely different custom agent, and any of
              them would be able to discover and call its three tools the same way, because they
              all speak the same protocol rather than each needing its own bespoke adapter.
            </p>
          }
          beginner={
            <p>
              <strong>MCP, the protocol, simply:</strong> before a standard like this existed,
              connecting a new tool to a new AI assistant meant writing brand-new, custom glue code
              every single time, for every single pairing. MCP solves that by being a shared,
              published rulebook that any AI tool and any AI assistant can both agree to follow:
              once a tool speaks MCP, any assistant that also speaks MCP can use it immediately, no
              custom glue code needed. That's the actual, practical reason this matters: the exact
              same little weather-and-time program this app builds could be plugged into Claude
              Desktop, into Claude Code, or into a completely different company's AI assistant
              tomorrow, with zero changes to the program itself. This app's own tool server only
              offers one of the three things the rulebook allows ("tools," meaning callable actions
              like "get the weather"); the same rulebook also has a standard way to share readable
              data (like files) and reusable prompt templates, this app's demo simply doesn't need
              those two for what it's showing.
            </p>
          }
        />
        <BranchFigure
          trunk={{ label: "MCP specification" }}
          branches={[
            { label: "tools", sub: "this app uses this" },
            { label: "resources" },
            { label: "prompts" },
          ]}
          caption="Figure 31. One protocol, three kinds of thing a server can expose."
        />
        <Explanation
          technical={
            <p>
              <strong>LangGraph's `StateGraph`, one level deeper:</strong> a `StateGraph` is built
              from an explicit shape of "state" (here, `ExplainerState` in
              `explainer/buildAndRun.ts`, an `Annotation.Root` with fields like `question`,
              `context`, `mermaidDefinition`, `explanation`) plus a set of named nodes, where each
              node is just a function that receives the current state and returns the fields it
              wants to update. What makes this more than a plain chain of function calls is the
              explicit `reducer` each field can define, the rule for *how* a node's returned
              update actually gets merged into the existing state rather than blindly overwriting
              it: `context`'s reducer concatenates arrays together (since the `retrieve` node's
              result should add to context, not replace a previous value that doesn't exist yet),
              while `mermaidDefinition` and `explanation` simply take whatever the latest node
              provided. The graph is "compiled" once (`workflow.compile()`) into a runnable object,
              then invoked with a starting state; LangGraph itself handles walking the fixed
              `start → retrieve → diagram → explain → end` edges and merging each node's output
              along the way, so this file never manually threads state from one function call to
              the next by hand.
            </p>
          }
          beginner={
            <p>
              <strong>LangGraph's `StateGraph`, simply:</strong> think of it as a single shared
              clipboard that gets physically carried from step to step in the three-step pipeline
              described above. At the very start, the clipboard just has your question written on
              it. The first step (looking up real passages) reads the question off the clipboard,
              finds the relevant passages, and writes them onto the clipboard too, so now it has
              both the question and the passages. The second step (drawing a diagram) reads
              everything written so far, and adds the diagram's text description onto the
              clipboard. The third step (writing an explanation) does the same, adding its own
              explanation at the end. By the time the clipboard reaches the end of the line,
              everything anyone needs, the original question, the real passages, the diagram, and
              the explanation, is sitting right there on it. The useful part is that nobody had to
              write code to manually carry each individual piece of information from one step to
              the next by hand, the system that manages this clipboard handles that automatically,
              so each step only has to worry about its own one job.
            </p>
          }
        />
        </ExplainModeProvider>

        <h2 id="bugs" className="font-display text-lg font-bold text-paper-ink scroll-mt-20">
          Real bugs found in production
        </h2>
        <p>
          <strong>1. Postgres connection hung forever on deploy.</strong> No explicit SSL config
          and no connection timeout on the `pg` `Pool` in `vectorStore.ts`. Never surfaced locally
          (Docker Postgres has no TLS at all), but hung indefinitely against Neon, which requires
          TLS, because `pg` doesn't reliably auto-enable TLS from a bare `?sslmode=require` query
          string alone. Fixed with an explicit `ssl` option (disabled only when the connection
          string contains "localhost") and a 30-second `connectionTimeoutMillis`, deliberately
          generous because Neon's free tier scales to zero when idle and a cold wake-up can
          occasionally take longer than a normal already-warm handshake.
        </p>
        <CompareFigure
          leftTitle="Before"
          leftItems={["No ssl config, no timeout", "Hangs forever against Neon"]}
          rightTitle="After"
          rightItems={["Explicit ssl option", "30s connectionTimeoutMillis"]}
          caption="Figure 32. Local Docker Postgres has no TLS; Neon requires it."
        />
        <p>
          <strong>2. A private service rejected every call with a misleading 404, not a 403.</strong>{" "}
          `python-service` is deployed with `--no-allow-unauthenticated`, correct for a service
          that should never be reachable from the public internet directly. But the calling code
          wasn't attaching a Google-signed identity token at all, just granting the `run.invoker`
          IAM role, which authorizes the caller but doesn't itself attach proof of identity to the
          HTTP request. Cloud Run masks an unauthenticated request to a private service as a plain
          404, specifically so an unauthorized caller can't even tell the service exists, which is
          exactly what made this hard to diagnose from logs alone (it looked like "wrong URL," not
          "missing auth"). Fixed by `backend/src/pythonServiceAuth.ts`, which fetches a short-lived
          ID token from Cloud Run's own metadata server automatically and attaches it as a Bearer
          header, but only when the target URL actually ends in `.run.app` (matched positively,
          not by blacklisting "localhost," which would have missed Docker Compose's own internal
          hostname `http://python-service:8001`).
        </p>
        <CompareFigure
          leftTitle="Before"
          leftItems={["IAM role granted, no ID token", "Looked like a 404: wrong URL"]}
          rightTitle="After"
          rightItems={["Real Bearer ID token attached", "Request actually authenticated"]}
          caption="Figure 33. Cloud Run hides a private service as a 404, not a 403, on purpose."
        />
        <p>
          <strong>3. A network-layer setting blocked the call even after fixing #2.</strong>{" "}
          `python-service` was also deployed with `--ingress internal`, which restricts traffic to
          genuinely VPC-internal sources. A plain Cloud-Run-to-Cloud-Run HTTP call over the public
          internet doesn't automatically count as "internal" without a VPC connector, which this
          project doesn't have, so the request was blocked at the network layer before
          authentication was even checked. Fixed by removing that flag entirely:
          `--no-allow-unauthenticated` plus the ID token from bug #2 was already the real security
          boundary, and the ingress restriction was both redundant and, in this exact setup,
          actively broken.
        </p>
        <CompareFigure
          leftTitle="Before"
          leftItems={["--ingress internal set", "Blocked before auth was even checked"]}
          rightTitle="After"
          rightItems={["Flag removed entirely", "Auth + IAM is the real boundary"]}
          caption="Figure 34. A network-layer block can masquerade as an auth failure."
        />
        <p>
          <strong>4. The entire deployed site silently called localhost instead of the real backend.</strong>{" "}
          Next.js inlines any `NEXT_PUBLIC_*` environment variable directly into the client-side
          JavaScript bundle at build time, not read at runtime. The Docker build was passed the
          correct backend URL as a `--build-arg`, but `frontend/Dockerfile` never declared that
          build-arg as an `ARG`/`ENV` before the `npm run build` step ran, so it was silently
          ignored and every page fell back to `lib/api.ts`'s hardcoded `http://localhost:4000`
          default, unreachable from a real visitor's browser. Every single feature on the live
          site failed identically, which was itself the clue: confirmed by checking the actual
          failing request's URL in browser DevTools before touching any code.
        </p>
        <CompareFigure
          leftTitle="Before"
          leftItems={["Dockerfile missing ARG/ENV", "--build-arg silently ignored"]}
          rightTitle="After"
          rightItems={["ARG promoted to ENV", "Build-arg actually reaches next build"]}
          caption="Figure 35. Every feature failing identically was the clue: one shared, wrong address."
        />
        <p>
          <strong>5. The app worked for one user but would have failed under real concurrent traffic.</strong>{" "}
          Already covered in detail under "Why Neon + pgvector" above: the direct (non-pooled)
          Neon connection string has a much smaller connection ceiling than the pooled one, and
          Cloud Run opens a fresh connection pool per instance. Found by deliberately testing for
          it (25 concurrent requests) before it ever caused a real incident, not by waiting for
          one.
        </p>
        <CompareFigure
          leftTitle="Direct connection string"
          leftItems={["Small connection ceiling", "Multiple instances compete, exhaust it"]}
          rightTitle="Pooled connection string"
          rightItems={["-pooler hostname, PgBouncer", "25/25 concurrent requests succeeded"]}
          caption="Figure 36. Found by deliberately testing for load, not by waiting for an incident."
        />
        <p>
          <strong>6. CI/CD itself caught a real bug manual deploys never hit.</strong> An automated
          redeploy failed with the exact same category of error as bug #1, a database connection
          timeout, specifically because it ran after a period of no traffic, when Neon had gone
          idle and needed longer to wake up than the timeout allowed. Every manual deploy up to
          that point had happened right after active local testing, which kept the database warm
          and never exposed this. Fixed by raising the timeout further and reducing the retry
          count. A genuinely good example of why automated, independent redeployment surfaces real
          issues manual, developer-triggered deploys don't: the two happen under different
          real-world conditions.
        </p>
        <FlowFigure
          steps={[
            { label: "quiet period" },
            { label: "Neon scales to zero" },
            { label: "cold wake-up too slow", sub: "for the old timeout" },
          ]}
          caption="Figure 37. Automated redeploys hit real-world timing manual deploys never do."
        />
        <p>
          <strong>
            7. RAG secretly depended on the local filesystem even though "the knowledge base" was
            supposedly database-backed.
          </strong>{" "}
          Found very recently, and the best story here because of exactly how it was found. Chunk
          text and embeddings lived in Postgres, genuinely database-backed. But
          `knowledgeBaseFiles.ts`'s `getKnowledgeBaseTitle()`, called on every single RAG query to
          attach a readable title to each citation, was reading straight off local `.md` files on
          disk via `fs.readFileSync`, with an in-memory cache that happened to paper over the
          dependency as long as the backend process stayed running. The test that actually exposed
          it: delete the knowledge-base directory, fully restart the backend process (killing the
          cache), and watch the very next RAG query fail with a real `500` and the literal error
          text `ENOENT: no such file or directory, scandir '...backend\data\knowledge-base'`. The
          deeper risk: `backend/Dockerfile` explicitly had a line copying that exact directory into
          the production image, so if that file deletion had ever been committed and pushed, the
          Docker build itself would have failed in CI, not just crashed at runtime. The fix was
          architectural: a new `documents` table in Postgres (`source`, `title`, `content`), with
          `seedDocuments.ts` populating it going forward and the already-live production data
          backfilled by recovering the original file content straight from git history (the exact
          command was {"`git show HEAD:backend/data/knowledge-base/<file>`"}) rather than ever
          restoring the files to disk, since the deletion was intentional. Verified three separate
          ways before calling it done: a locally-built production Docker image run as a real
          container with the knowledge-base directory genuinely absent, then the actual live,
          deployed production URL hit directly with real HTTP requests after the push, both
          returning correct data.
        </p>
        <CompareFigure
          leftTitle="Before"
          leftItems={["Titles read from local .md files", "Dockerfile copied the directory in"]}
          rightTitle="After"
          rightItems={["Titles + content in a documents table", "No filesystem dependency at runtime"]}
          caption="Figure 38. Found by deleting the directory and restarting cold, on purpose."
        />

        <h2 id="scope" className="font-display text-lg font-bold text-paper-ink scroll-mt-20">
          Deliberate scope decisions
        </h2>
        <p>
          <strong>A visual drag-and-drop agent builder was built, then removed entirely.</strong>{" "}
          It let a user visually wire up a custom LangGraph agent on a canvas, and it worked
          technically. Using it myself made clear it handed a new visitor a blank canvas with no
          guidance on what to actually build. Rather than ship something technically correct but
          confusing, I deleted it entirely, frontend and backend both, and replaced the whole idea
          with something better-scoped: the question-driven explainer (Chapter 11), where a user
          just types a question instead of constructing a graph by hand.
        </p>
        <CompareFigure
          leftTitle="Built, then removed"
          leftItems={["Drag-and-drop graph canvas", "Worked technically", "Blank canvas, no guidance"]}
          rightTitle="Replaced with"
          rightItems={["A question-driven explainer", "Just type a question"]}
          caption="Figure 39. Technically correct isn't the same as actually usable."
        />
        <p>
          <strong>A local dev Ctrl+C fix was partially built, then intentionally rolled back.</strong>{" "}
          Pressing Ctrl+C locally used to require a second Ctrl+C plus a "Y" confirmation. I
          diagnosed the real layered cause (a Windows batch-file wrapper issue, several layers
          deep) and built a fix, but it required changing how `npm` invoked scripts on Windows,
          real added complexity for a problem that only ever affected local developer experience.
          I judged the complexity wasn't worth it for a solo project and reverted it, keeping only
          the one small, low-risk piece (a direct `SIGINT` handler) worth keeping on its own
          merits.
        </p>
        <BadgeFigure
          glyph="↩"
          label="Reverted on purpose"
          caption="real added complexity for a local-only problem; kept only the one low-risk piece worth it."
        />
        <p>
          <strong>LangChain/LangGraph was deliberately not used to rebuild the hand-built agent.</strong>{" "}
          Covered in detail above under "Exactly how each feature works" and in the architecture
          section's tech-stack reasoning. The short version: doing so would have been the same
          capability wrapped in a framework, not a new one, and would have been resume-keyword-
          driven rather than engineering-driven.
        </p>
        <BadgeFigure
          glyph="✕"
          label="Not reused for the agent"
          caption="would have been the same capability wrapped in a framework, not a new one."
        />
        <p>
          <strong>No speech-to-text input on Chapter 11, only text-to-speech output.</strong> A
          microphone permission prompt on a page meant to help a confused visitor would add a new
          failure mode to a feature whose entire purpose is reducing confusion. Text-to-speech
          output survived as a small, real accessibility feature (a "Listen" button using the
          browser's own built-in `SpeechSynthesis` API, no server-side text-to-speech service
          needed) since it adds no new failure mode at all.
        </p>
        <CompareFigure
          leftTitle="Dropped"
          leftItems={["Speech-to-text input", "A new failure mode: mic permissions"]}
          rightTitle="Kept"
          rightItems={["Text-to-speech output only", "Browser's own SpeechSynthesis API"]}
          caption="Figure 40. Output-only voice, deliberately, on a page meant to reduce confusion."
        />

        <h2 id="recent" className="font-display text-lg font-bold text-paper-ink scroll-mt-20">
          Recent work: the database migration + a full cleanup pass
        </h2>
        <p>
          Beyond bug #7 itself above, the surrounding process is worth knowing on its own:
        </p>
        <p>
          <strong>Built a small internal CLI</strong> (`npm run kb -- upsert|remove|list`,
          `backend/scripts/kb.ts`) for adding, editing or removing one knowledge-base article going
          forward, reusing the exact same chunk-then-embed pipeline the app's own startup seed
          already uses, rather than writing a second, parallel implementation of the same idea.
        </p>
        <BadgeFigure
          glyph="kb"
          label="npm run kb"
          caption="upsert, remove, list — one real tool, reusing the existing seed pipeline, not a second copy of it."
        />
        <p>
          <strong>Treated a safety branch correctly under real pressure to ship.</strong> Before
          pushing the database-migration work to the branch GitHub Actions actually deploys from
          (`main`), I kept an untouched snapshot of the prior, known-good state reachable on its
          own branch, confirmed exactly how Cloud Run would roll back if something broke (its own
          instant revision traffic-shifting, which is faster than any git-based rollback since it
          skips a full rebuild), and only deleted that now-redundant safety branch once the new
          code was confirmed working in production, not just "deployed."
        </p>
        <FlowFigure
          steps={[
            { label: "safety branch kept" },
            { label: "new code verified in prod" },
            { label: "safety branch deleted" },
          ]}
          caption="Figure 41. The rollback plan was confirmed to work before it was ever thrown away."
        />
        <p>
          <strong>Verified against the real, deployed site, not just a green checkmark.</strong>{" "}
          After every meaningful change, the actual production URL got a real HTTP request: the
          GitHub Actions run's own `conclusion` field was confirmed `"success"` via its public API,
          then the live `/api/rag/query` and `/api/rag/sources` endpoints were hit directly and
          their real JSON read back, since a successful deploy and a working feature are two
          different claims that both deserve checking.
        </p>
        <PipelineFigure
          steps={[
            { label: "GitHub Actions: success" },
            { label: "real HTTP request" },
            { label: "real JSON confirmed" },
          ]}
          caption="Figure 42. A successful deploy and a working feature are two different claims."
        />
        <p>
          <strong>A full, tool-assisted dead-code audit across the entire repo.</strong> Rather
          than guess at what might be unused, I ran `knip` (a static unused-code/exports/
          dependencies analyzer) against `backend/`, `frontend/` and `mcp-server/` separately, and
          `vulture` against `python-service/`. Every flagged item was individually verified by hand
          before touching anything, since a static tool can produce false positives (vulture
          flagged several FastAPI route handlers and Pydantic model fields as "unused," which are
          actually invoked by the framework at runtime through decorators, not through a plain
          function call the tool can trace, so they were correctly left alone). Everything
          confirmed genuinely unused was removed outright. Verified clean afterward with a second
          `knip` run (zero findings on both services), a full `tsc` typecheck and a full production
          build of both services, and a live runtime smoke test hitting every endpoint whose
          underlying file had been touched.
        </p>
        <PipelineFigure
          steps={[
            { label: "knip + vulture" },
            { label: "verify by hand" },
            { label: "remove confirmed dead code" },
            { label: "re-verify clean" },
          ]}
          caption="Figure 43. A static tool proposes; verifying by hand decides."
        />

        <h2 id="built" className="font-display text-lg font-bold text-paper-ink scroll-mt-20">
          How it was actually built
        </h2>
        <p>
          Built using Claude Code heavily, over about 7 days initially, with continued iteration
          since. I directed every decision, reviewed every change, and did the actual verification
          myself: running the real system, reading real logs, testing real HTTP endpoints,
          confirming real bugs before claiming they were fixed. If asked directly whether I wrote
          all of this myself: I used AI assistance extensively, and reviewed and directed every
          part of it. Being able to explain exactly why every decision above was made, and exactly
          how each mechanism works, in my own words, is the actual proof of understanding what was
          built, not just that I typed the commands.
        </p>
        <BadgeFigure
          glyph="7d"
          label="Built in ~7 days, then iterated"
          caption="every decision directed and reviewed by me; every claim verified against the real, running system."
        />

        <h2 id="faq" className="font-display text-lg font-bold text-paper-ink scroll-mt-20">
          Likely follow-up questions
        </h2>
        <p>
          <strong>"Would a dedicated vector database have been better?"</strong> At larger scale,
          likely yes for raw performance and specialized features. At this project's actual scale,
          pgvector's trade-off (one database instead of two systems) was the right call, not a
          strictly superior one, and I'd say so plainly if asked.
        </p>
        <BadgeFigure
          glyph="?"
          label="Honest trade-off, not a sales pitch"
          caption="the right call at this scale, not a claim that it's strictly better everywhere."
        />
        <p>
          <strong>"Tell me about a real bug you found and fixed."</strong> Bug #7 above (the
          filesystem-dependency bug) is the strongest answer: found via a deliberate, adversarial
          test, root-caused correctly on the first pass, fixed architecturally rather than patched
          over, and verified three separate ways before calling it done.
        </p>
        <BadgeFigure glyph="7" label="Bug #7 is the headline answer" caption="see the full story above." />
        <p>
          <strong>"How would this handle real production scale?"</strong> Cloud Run's
          infrastructure already handles meaningful concurrency on its own. The one real scaling
          risk actually found (Postgres connection pooling, bug #5) was found and fixed before it
          caused a real incident, by proactively testing for it rather than waiting.
        </p>
        <BadgeFigure
          glyph="✓"
          label="Tested proactively, not reactively"
          caption="25 concurrent requests, fixed before it ever caused a real incident."
        />
        <p>
          <strong>"What would you do differently next time?"</strong> Set up the pooled Postgres
          connection, the correct Cloud Run ingress/auth settings, and database-backed knowledge-
          base storage from the very first implementation, rather than discovering each one live.
          All three are now documented in this project's own deployment and knowledge-base guides
          specifically so a future setup doesn't repeat the same discovery process.
        </p>
        <BranchFigure
          trunk={{ label: "Do from day one next time" }}
          branches={[
            { label: "Pooled Postgres" },
            { label: "Correct ingress/auth" },
            { label: "DB-backed knowledge base" },
          ]}
          caption="Figure 44. All three discovered live; all three now documented so it won't repeat."
        />

        <CompassIllustration />
        <h2 id="beginner" className="font-display text-lg font-bold text-paper-ink scroll-mt-20">
          The codebase, explained from zero
        </h2>
        <p className="italic text-paper-ink/60">
          Written as if you've genuinely never opened a real codebase before. If a term below is
          unfamiliar the first time it's used, it's explained right there, not assumed.
        </p>

        <h3 className="font-display text-base font-bold text-paper-ink">
          First: what these words even mean, using this project as the example
        </h3>
        <p>
          A <strong>codebase</strong> is just the complete set of text files that make up a piece
          of software, kept in a folder (here, a folder called `ai-nexus`). Almost every file in
          it is plain text you could open in Notepad; what makes it "code" rather than an essay is
          that it's written in a strict, picky language a computer can execute step by step,
          instead of a language meant for a human to read loosely.
        </p>
        <BadgeFigure glyph="{ }" label="Codebase" caption="the complete set of text files that make up this app." />
        <p>
          A <strong>frontend</strong> is the part of an app a person actually looks at and clicks
          on in a browser, here, everything inside the `frontend/` folder. A{" "}
          <strong>backend</strong> is a program that doesn't have any buttons or colors at all; it
          just waits for a request to arrive over the network, does some work, and sends an answer
          back, here, everything inside `backend/`. When you click a button on this app's website,
          the frontend doesn't do the actual thinking itself, it sends a message to the backend
          asking it to do the work, then displays whatever comes back.
        </p>
        <CompareFigure
          leftTitle="Frontend"
          leftItems={["What you see and click", "Can't think on its own"]}
          rightTitle="Backend"
          rightItems={["No buttons, no colors", "Does the actual work"]}
          caption="Figure 45. The frontend asks; the backend decides and answers."
        />
        <p>
          That message-and-answer exchange is called an <strong>API call</strong> ("API" stands
          for Application Programming Interface, but the name isn't important, what matters is
          what it does): the frontend sends a small, structured request (like "here's the question
          the user typed, please answer it"), over the internet (or, when running on your own
          computer, over `localhost`, a special address meaning "this same computer"), to a
          specific web address the backend is listening on, and gets back a structured answer,
          almost always in a text format called <strong>JSON</strong> (a simple way of writing
          data as pairs, like "answer" paired with the actual answer text), which looks like:{" "}
          <code>{'{ "answer": "...", "sources": [...] }'}</code>.
        </p>
        <PipelineFigure
          steps={[{ label: "request" }, { label: "over the network" }, { label: "structured answer" }]}
          caption="Figure 46. An API call: a small, structured question and a small, structured answer."
        />
        <p>
          A <strong>database</strong> is a separate program whose only job is storing information
          so it's still there after the app that wrote it shuts down, and can be searched quickly
          later. This project uses <strong>Postgres</strong>, one of the most widely used real
          databases in the world, running as its own separate program, with a real database called
          `nexus_vectors` inside it, and two <strong>tables</strong> (a table is just a grid, like
          a spreadsheet, with named columns and one row per item) called `chunks` and `documents`.
        </p>
        <BadgeFigure glyph="DB" label="Database" caption="stores information so it's still there after the app that wrote it shuts down." />
        <p>
          A <strong>repository</strong> ("repo" for short) is this whole project folder, tracked
          by a tool called <strong>git</strong>, which remembers every past version of every file
          so changes can be undone, compared, or shared. <strong>GitHub</strong> is just a website
          that hosts a copy of a git repository online so other people (or an automated system)
          can see it or download it.
        </p>
        <BadgeFigure glyph="git" label="Repository" caption="this whole project folder, with every past version remembered." />
        <p>
          A <strong>container</strong> (via a tool called <strong>Docker</strong>) is a way of
          packaging a program together with absolutely everything it needs to run (the exact
          version of its programming language, every library it depends on) into one self-
          contained bundle, so it runs identically on any computer, instead of "it worked on my
          machine but not on the server" because the server happened to have a different version
          of something installed. Each of this project's four services has its own `Dockerfile`, a
          plain-text recipe listing the exact steps to build that service's container.
        </p>
        <BadgeFigure
          glyph="□"
          label="Container"
          caption="a program packaged with everything it needs, so it runs identically anywhere."
        />
        <p>
          <strong>Deploying</strong> an app means putting a running copy of it somewhere other
          than your own computer, reachable by anyone on the internet. This project deploys to{" "}
          <strong>Google Cloud Run</strong>, a service that runs a container for you and gives it
          a real public web address, scaling it up or down automatically as traffic changes.
        </p>
        <BadgeFigure glyph="▲" label="Deploying" caption="putting a running copy somewhere else, reachable by anyone on the internet." />
        <p>
          An <strong>environment variable</strong> is a named piece of configuration (like a
          secret API key, or which address to connect to) that lives outside the code itself,
          read by the program when it starts, so the exact same code can run differently in
          different places (your own computer vs. the live deployed site) without editing the
          code at all. Locally, this project reads them from a file called `.env` in the project's
          root folder; deployed, Cloud Run injects them directly, and the live app never has a
          `.env` file at all.
        </p>
        <BadgeFigure
          glyph="env"
          label="Environment variable"
          caption="configuration kept outside the code, so the same code runs differently in different places."
        />

        <h3 className="font-display text-base font-bold text-paper-ink">
          The actual folder structure, and what each top-level folder is for
        </h3>
        <p>
          Opening the `ai-nexus` folder, you'd see: `frontend/` (everything the visitor's browser
          actually downloads and runs), `backend/` (the Express server: the "brain" that decides
          what to do with every request), `python-service/` (a second, smaller backend, written in
          Python instead of the same language as the first one, used only for the handful of
          things Python's tools do better), `mcp-server/` (a small standalone program the main
          backend starts up as a side-process to give the AI agent real tools to use), `info/`
          (plain-English documentation about this exact project, written for a human to read, not
          code the app runs), `docker-compose.yml` (one file that can start several containers
          together with one command, used for local development), `.github/workflows/deploy.yml`
          (instructions for GitHub's own automation: what to do every time new code is pushed), and
          `package.json` at the very top (a small file every Node.js-based project has, listing
          short names, like `dev` or `stop`, for longer commands, so you can type `npm run dev`
          instead of memorizing the full real command).
        </p>
        <BranchFigure
          trunk={{ label: "ai-nexus/" }}
          branches={[
            { label: "frontend/" },
            { label: "backend/" },
            { label: "python-service/" },
            { label: "mcp-server/" },
            { label: "info/" },
          ]}
          caption="Figure 47. The top-level folders, each with one clear job."
        />

        <h3 className="font-display text-base font-bold text-paper-ink">
          One full, real example, traced from a click to an answer
        </h3>
        <p>
          Imagine you're on the live website, on the RAG chapter page, and you type "What is
          retrieval-augmented generation?" and click a button. Here is genuinely everything that
          happens, in order, with no steps skipped:
        </p>
        <p>
          <strong>1.</strong> The button click runs a small piece of JavaScript code already
          loaded into your browser (from a file called `frontend/app/rag/page.tsx`), which packages
          your question into a JSON message and sends it, over the internet, to a specific web
          address: the backend's address, followed by `/api/rag/query`. The browser doesn't know
          or care what's on the other end, it just sends the message and waits.
        </p>
        <p>
          <strong>2.</strong> The backend (a separate, always-running program, written in
          TypeScript, using a framework called Express that specializes in listening for exactly
          these kinds of web requests) receives the message. Express looks at the address the
          message was sent to (`/api/rag/query`) and, because of one line in `backend/src/
          server.ts` that says, in effect, "anything arriving at `/api/rag` goes to this specific
          file," hands the message to `backend/src/routes/rag.route.ts`.
        </p>
        <p>
          <strong>3.</strong> That file pulls your question out of the message and calls a
          function, `embedTexts()`, to turn your plain-English question into a list of 1024
          numbers (called an <strong>embedding</strong>) that represents its *meaning* in a form a
          computer can mathematically compare. It doesn't compute this itself, it sends another
          API call, this time to the second backend, `python-service`, specifically because that
          service is the one piece of this whole system that actually knows how to talk to Voyage
          AI, a real company whose entire product is converting text into these number lists.
        </p>
        <p>
          <strong>4.</strong> `python-service` receives that request, calls Voyage AI's real API
          over the internet, gets back 1024 numbers, and sends them straight back to the backend.
        </p>
        <p>
          <strong>5.</strong> The backend now has your question as 1024 numbers. It asks the
          database (Postgres) a question of its own, in a special database language called
          <strong> SQL</strong>: "out of every stored chunk of text you're holding, give me the 4
          whose own 1024 numbers are mathematically closest to these." The database was built with
          a special index (a pre-built shortcut structure, the way a book's index lets you skip
          straight to a page instead of reading the whole book) specifically so this comparison is
          fast even with lots of stored chunks. It answers with the 4 closest passages of real
          text, each pulled from one of this app's own short articles about AI concepts.
        </p>
        <p>
          <strong>6.</strong> The backend now builds one big piece of text (called a{" "}
          <strong>prompt</strong>, which just means "the instructions and information you hand to
          an AI model before asking it to answer") that contains strict instructions ("answer only
          using the following numbered passages, and say so if the answer isn't in them") followed
          by those 4 real passages, numbered 1 through 4.
        </p>
        <p>
          <strong>7.</strong> That whole prompt, plus your original question, is sent in one more
          API call, this time to Anthropic, the real company that makes the Claude AI model. This
          is the only step in the whole chain that costs real money and takes a genuinely
          intelligent model to do: Claude reads the instructions and the 4 passages, and writes a
          real, original answer, citing which numbered passage each part of its answer came from.
        </p>
        <p>
          <strong>8.</strong> Claude's answer travels back to the backend, which packages it
          together with the 4 source passages (so the website can show you exactly where the
          answer came from) into one JSON message, and sends that back over the internet to your
          browser, as the direct reply to the original request from step 1.
        </p>
        <p>
          <strong>9.</strong> The frontend code receives that JSON message and updates the page you
          see: the answer appears, followed by numbered citation cards, with no page reload at
          all, because this whole exchange happened invisibly in the background while you kept
          looking at the same page.
        </p>
        <p>
          That's the entire system, end to end, for one single question: five different real
          programs (your browser, the backend, python-service, Postgres, and Claude itself, with
          Voyage AI as a sixth for the embedding step) each doing one small, specific job and
          handing off to the next, over real network requests, finishing in about one to three
          seconds. Every other feature in this app (the agent, the summarizer, the diagram
          explainer) follows this same basic shape: receive a request, gather or compute whatever's
          needed, optionally ask a real AI model, send a real answer back.
        </p>
        <PipelineFigure
          steps={[
            { label: "browser" },
            { label: "backend" },
            { label: "python-service" },
            { label: "database" },
            { label: "Claude" },
          ]}
          caption="Figure 48. Five real programs, one small job each, one to three seconds end to end."
        />

        <h3 className="font-display text-base font-bold text-paper-ink">
          Why four separate programs instead of one
        </h3>
        <p>
          A natural question: why not write this as a single, simpler program? Two honest reasons.
          First, different jobs genuinely need different tools, the same way a kitchen has both an
          oven and a fridge instead of one all-purpose box: Python has excellent, mature libraries
          for working with text and numbers (which is why embeddings and a few other algorithms
          live in `python-service`), while the frontend has to be written in JavaScript or
          TypeScript because that's the only language a web browser can actually run. Second,
          splitting work into separate programs means each one can be updated, restarted, or scaled
          up independently: if lots of people are using the RAG chapter at once, Cloud Run can run
          more copies of just the backend, without needing more copies of the frontend or
          `python-service` too, since they're separate, independently-scalable programs rather than
          one single monolith that would all have to scale together.
        </p>
        <CompareFigure
          leftTitle="One single program"
          leftItems={["Simpler at first glance", "Python tooling reimplemented in JS", "Everything scales together, or not at all"]}
          rightTitle="Four separate programs (chosen)"
          rightItems={["Right language per job", "Each one scales independently"]}
          caption="Figure 49. Like a kitchen with an oven and a fridge, not one all-purpose box."
        />

        <h3 className="font-display text-base font-bold text-paper-ink">
          What "deploying" this app actually involves
        </h3>
        <p>
          When new code is pushed to this project's `main` branch on GitHub, GitHub itself notices
          and automatically starts a short-lived helper computer (this is what "GitHub Actions"
          means) that runs a fixed checklist, written in `.github/workflows/deploy.yml`: build each
          service's Docker container (turning the source code into that self-contained,
          runs-anywhere bundle described earlier), push each container to Google Cloud's container
          storage, then tell Google Cloud Run "start running this exact container publicly." Cloud
          Run gives each service a real web address and keeps it running, automatically starting
          more copies if traffic increases and shutting copies down (even down to zero) when
          nobody's using it, which is also how this project avoids any hosting cost most of the
          time: Google Cloud Run's free tier covers a generous amount of usage, and an idle service
          costs nothing at all while it's scaled down to zero.
        </p>
        <PipelineFigure
          steps={[
            { label: "push to main" },
            { label: "build containers" },
            { label: "push images" },
            { label: "Cloud Run runs them" },
          ]}
          caption="Figure 50. Deploying, start to finish, with nobody running a command by hand."
        />
      </TextbookPage>
    </div>
  );
}
