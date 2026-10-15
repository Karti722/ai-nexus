import { TextbookPage } from "@/components/TextbookPage";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function InterviewPrepPage() {
  return (
    <div className="space-y-10">
      <TextbookPage eyebrow="Personal" title="Interview Prep: AI Nexus" pageNumber="Private">
        <p className="italic text-paper-ink/60">
          Reference notes, not a script. Read it through once, then use it to jog your memory live
          rather than reciting it. Everything below is something that was actually built, actually
          tested, or actually happened, nothing is aspirational unless explicitly marked as a
          "considered and rejected" alternative.
        </p>

        <h2 className="font-display text-lg font-bold text-paper-ink">The one-minute summary</h2>
        <p>
          AI Nexus is a full-stack AI engineering platform I designed and built myself, live at
          ai-nexus-textbook.com. It's structured like a short interactive textbook: eleven chapters,
          each covering one real AI engineering concept, and every one is backed by a genuinely
          working implementation, not a mockup. I built it because most programs teach the theory
          behind AI models without ever getting into how these systems are actually built in
          production, and I wanted to close that gap for myself by building the real thing. It's
          deployed on Google Cloud Run with a full CI/CD pipeline through GitHub Actions using
          Workload Identity Federation instead of a static credential. Built in about 7 days
          initially, and I've kept iterating on it since: a new chapter, several real production
          bugs found and fixed, and a full migration of the RAG knowledge base onto the database as
          its single source of truth.
        </p>

        <h2 className="font-display text-lg font-bold text-paper-ink">Architecture: the four services, and why split this way</h2>
        <p>
          frontend/ (Next.js/TypeScript, the eleven chapters) talks over REST to backend/ (Express/
          TypeScript, orchestrates every LLM call, RAG, the agent, and the LangGraph explainer),
          which in turn calls python-service/ (FastAPI, the one place embeddings and classical NLP
          algorithms run) and spawns mcp-server/ (a standalone Model Context Protocol server) as a
          child process. Each piece uses the language/runtime best suited to its actual job, not one
          language forced everywhere for consistency's sake, and each scales independently on Cloud
          Run.
        </p>
        <p>
          <strong>Why Next.js + a separate Python microservice, not Python for everything:</strong>{" "}
          Next.js is the strongest option for a modern React frontend; Python has the best tooling
          for the embedding/NLP-heavy work (the Voyage SDK, numerical libraries, TextRank). Rather
          than force a worse fit somewhere, I split by concern. The tradeoff is real operational
          complexity (another service, another network hop, another container to version), accepted
          because the alternative was a worse-fit Python frontend or a badly-reimplemented
          embedding/NLP ecosystem in JavaScript.
        </p>
        <p>
          <strong>Why Postgres + pgvector on Neon, not a dedicated vector database:</strong> This
          project already needed a real relational database, so pgvector means one database
          technology instead of two systems to run and secure. It's a production-proven pattern (not
          a toy shortcut) with a genuine HNSW index, the same core ANN algorithm dedicated vector
          databases use internally, and cosine similarity search is pushed down into SQL itself
          rather than scored by hand. The honest tradeoff: a dedicated vector database would likely
          out-scale pgvector at hundreds of millions of vectors; at this project's actual scale (a
          few dozen chunks) that tradeoff wasn't worth the operational cost of a second database.
          Neon specifically for hosting: a genuine free tier, and critically a pooled connection
          option (PgBouncer) built for exactly the multi-instance scaling pattern Cloud Run uses.
        </p>
        <p>
          <strong>Real APIs instead of from-scratch algorithms, and why that changed over time:</strong>{" "}
          A hand-trained BPE tokenizer and a hashing-based embedding scheme were both replaced with
          real API calls. This wasn't cosmetic: the from-scratch tokenizer had an actual correctness
          bug (a "cost to run this on claude-sonnet-5" figure computed from a token count that wasn't
          actually that model's real tokenization), and the from-scratch embedding scheme measurably
          hurt retrieval quality everywhere it was used. What stayed from-scratch deliberately: the
          calculator (a hand-written recursive-descent parser, not eval()/Function(), for security),
          TextRank, keyword extraction, readability scoring, and ROUGE-L, kept because there was no
          correctness problem to fix and building them by hand is the point of that part of the demo.
        </p>
        <p>
          <strong>Why MCP for tool use, not a custom tool-calling scheme:</strong> MCP is an open
          standard so an agent and a tool server that have never seen each other can still work
          together. I built a real MCP server and a real MCP client, demonstrating the actual
          protocol, not a simplified stand-in.
        </p>
        <p>
          <strong>Why two different agent approaches exist in the same app:</strong> Chapter 4's
          agent is a hand-built ReAct loop against Claude's tool-use API directly, to show how an
          agent works at the lowest level. The LangGraph-based explainer (Chapter 11) is a
          completely different, fixed three-step pipeline, built with LangGraph specifically because
          that's the right tool for a fixed multi-step workflow, not an agent making runtime
          decisions. I deliberately did not use LangGraph to reimplement Chapter 4's agent, since
          that would have been redundant, not a new capability.
        </p>
        <p>
          <strong>Why Cloud Run, GitHub Actions, and Workload Identity Federation:</strong> Cloud Run
          gives a genuine $0/month path with scale-to-zero while still being a real production
          container platform. CI/CD authenticates via Workload Identity Federation, not a
          downloadable service account key, so there's no long-lived credential that could leak.
          Every image is tagged by commit SHA, not "latest," so rolling back means redeploying an
          old, still-pullable tag.
        </p>

        <h2 className="font-display text-lg font-bold text-paper-ink">Real bugs found in production</h2>
        <p>
          This is the part that shows actual engineering, not just feature-building. Every one of
          these was found by running the real system and reading the real failure.
        </p>
        <p>
          <strong>1. Postgres connection hung forever on deploy.</strong> No explicit SSL config and
          no connection timeout, which never surfaced against local Docker Postgres (no TLS) but
          hung forever against Neon (requires TLS). Fixed with explicit SSL config and a generous
          30-second timeout, later found to still be worth keeping generous because Neon's free tier
          scales to zero and a cold wake-up can take longer than a normal handshake.
        </p>
        <p>
          <strong>2. A private service rejected every call with a misleading 404, not a 403.</strong>{" "}
          The Python service is private by design, but the calling code wasn't attaching a required
          Google-signed identity token at all. Cloud Run masks unauthenticated requests to private
          services as 404, specifically so an unauthorized caller can't tell the service exists,
          which made this one genuinely hard to diagnose from logs alone. Fixed by fetching a
          short-lived ID token from Cloud Run's own metadata server, only in production.
        </p>
        <p>
          <strong>3. A network-layer setting blocked the call even after fixing #2.</strong> The
          Python service was deployed with --ingress internal, which doesn't automatically treat a
          plain Cloud-Run-to-Cloud-Run call over the public internet as "internal" without a VPC
          connector this project doesn't have. Removing that flag was the fix; --no-allow-unauthenticated
          plus the ID token from #2 was already the real security boundary.
        </p>
        <p>
          <strong>4. The entire deployed site silently called localhost instead of the real backend.</strong>{" "}
          Next.js inlines NEXT_PUBLIC_* env vars at build time, but the Dockerfile never declared
          that build-arg as an ARG/ENV before the build step, so it was silently ignored and every
          page fell back to its hardcoded localhost default. Every feature failed identically,
          exactly the right signature for "everything is broken the same way."
        </p>
        <p>
          <strong>5. The app worked for one user but would have failed under real concurrent traffic.</strong>{" "}
          Cloud Run scales the backend to multiple instances, each opening its own Postgres pool, but
          the connection string was using Neon's direct endpoint instead of the pooled one built for
          exactly this scenario. Found by deliberately testing for it (25 concurrent requests),
          anticipating a real traffic spike, not by waiting for an incident.
        </p>
        <p>
          <strong>6. A third-party library didn't yet support the model being used.</strong>{" "}
          @langchain/anthropic has a hardcoded list of model names for which it correctly omits an
          internal top_p sentinel value; claude-sonnet-5 predates that list, so it sent an invalid
          value the API rejected outright. Fixed by forcing that property to undefined directly on
          the client instance after construction.
        </p>
        <p>
          <strong>7. CI/CD itself caught a real bug manual deploys never hit.</strong> An automated
          redeploy failed with a database timeout because it ran after a period of no traffic, when
          Neon had gone idle; every manual deploy up to that point happened right after active local
          testing, which kept the database warm. A genuine example of why automated, independent
          redeployment surfaces issues manual deploys don't.
        </p>
        <p>
          <strong>
            8. RAG secretly depended on the local filesystem even though "the knowledge base" was
            supposedly database-backed.
          </strong>{" "}
          Found very recently, and one of the best stories here because of how it was found. Chunk
          text and embeddings lived in Postgres, genuinely DB-backed. But article titles, looked up
          on every single RAG query for citations, and full article content for the "browse the
          knowledge base" viewer, were still read straight off local .md files on disk. This worked
          by accident for a long time because a long-running dev process kept those titles cached in
          memory. The real test that exposed it: I deleted the knowledge-base directory, restarted
          the backend from scratch (no cache), and watched the very next RAG query 500 with an
          ENOENT error, since the directory the app assumed would always exist was gone. The deeper
          risk: if that deletion had been committed and pushed, the Docker build itself would have
          failed in CI (not just a runtime crash), since the Dockerfile explicitly copied that
          directory into the image. The fix was architectural, not a patch: a new `documents` table
          in Postgres (source, title, content), with `seedDocuments.ts` populating it going forward
          and the existing production data backfilled by recovering the original file content from
          git history (`git show HEAD:path`) rather than ever restoring the files to disk, since the
          files were being deleted on purpose. Verified by building the actual production Docker
          image locally, running it as a real container with the knowledge-base directory genuinely
          absent, and confirming every endpoint still returned correct data, then confirming the
          exact same thing again against the real, live, deployed production URL after the push.
        </p>

        <h2 className="font-display text-lg font-bold text-paper-ink">Deliberate scope decisions</h2>
        <p>
          <strong>A visual drag-and-drop agent builder was built, then removed.</strong> It worked
          technically, but using it myself made clear it handed a new user a blank canvas with no
          guidance. Rather than ship something technically correct but confusing, I deleted the
          frontend entirely and replaced the idea with something better-scoped: the question-driven
          explainer (Chapter 11). Its backend half, a full LangGraph-based graph compiler, is still
          physically in the repo as dead code (never imported by the server, never referenced by any
          frontend page), a real, honest example of knowing when to cut scope rather than defend a
          sunk cost, and of what it looks like when a cut isn't followed all the way through.
        </p>
        <p>
          <strong>A local dev Ctrl+C fix was partially built, then intentionally rolled back.</strong>{" "}
          I diagnosed the actual layered cause (a Windows batch-file wrapper issue) and built a fix,
          but it added real complexity for a problem that only affected local developer experience.
          I judged the complexity wasn't worth it for a solo project and reverted it, keeping only
          the one small, low-risk part (a direct SIGINT handler) worth keeping on its own merits.
        </p>
        <p>
          <strong>LangChain/LangGraph was deliberately not used to rebuild the existing agent.</strong>{" "}
          The temptation to use a trendy framework everywhere was real; doing so where it wasn't a
          good fit would have been resume-keyword-driven, not engineering-driven.
        </p>
        <p>
          <strong>No speech-to-text input on Chapter 11, only text-to-speech output.</strong> A
          microphone permission prompt on a page meant to help a confused visitor adds a new failure
          mode to a feature whose entire purpose is reducing confusion. Text-to-speech output
          survived as a small, real accessibility feature since it adds no new failure mode.
        </p>

        <h2 className="font-display text-lg font-bold text-paper-ink">Recent work: making the knowledge base genuinely database-backed</h2>
        <p>
          Beyond the bug itself (above), the surrounding work is worth knowing as its own story about
          process, not just the fix:
        </p>
        <p>
          <strong>Built a small internal CLI</strong> (`npm run kb -- upsert|remove|list`,
          `backend/scripts/kb.ts`) for adding, editing or removing a knowledge-base article going
          forward, reusing the exact same chunk-then-embed pipeline the app's own startup seed uses
          rather than writing a second, parallel implementation of the same idea.
        </p>
        <p>
          <strong>Treated a safety branch correctly under real pressure to ship.</strong> Before
          pushing the database-migration work to the branch GitHub Actions actually deploys from, I
          made sure an untouched snapshot of the prior, known-good state stayed reachable on its own
          branch, confirmed the exact mechanics of how Cloud Run would roll back if something broke
          (its own instant revision traffic-shifting is faster than any git-based rollback, since it
          skips a full rebuild), and only then deleted the now-redundant safety branch once the new
          code was confirmed working in production, not just "deployed."
        </p>
        <p>
          <strong>Verified against the real, deployed site, not just a green checkmark.</strong>{" "}
          After every meaningful change, the actual production URL got a real HTTP request, not just
          a glance at GitHub's UI: confirming a GitHub Actions run's `conclusion` was `success` via
          its public API, then separately hitting the live `/api/rag/query` and `/api/rag/sources`
          endpoints directly and reading the real JSON back, since a successful deploy and a working
          feature are two different claims.
        </p>
        <p>
          <strong>Shipped a new page from direct, iterative feedback, in small steps.</strong> A
          `/technologies` reference page went through several rounds based on specific feedback
          mid-build: first a plain recap mirroring internal file paths, then reworked to show page
          routes a visitor could actually click instead of file paths once asked to think about the
          actual audience, then visually brought in line with the rest of the app's existing
          component conventions instead of a bespoke style. Small, concrete, sequential corrections,
          not one big upfront spec.
        </p>

        <h2 className="font-display text-lg font-bold text-paper-ink">How it was actually built</h2>
        <p>
          Built using Claude Code heavily, over about 7 days initially, with continued iteration
          since. I directed every decision, reviewed every change, and did the actual verification
          myself: running the real system, reading real logs, testing real HTTP endpoints, confirming
          real bugs before claiming they were fixed. If asked directly whether I wrote all of this
          myself: I used AI assistance extensively and reviewed and directed every part of it. Being
          able to explain exactly why every decision above was made, in my own words, is the actual
          proof of understanding what was built, not just that I typed the commands.
        </p>

        <h2 className="font-display text-lg font-bold text-paper-ink">Likely follow-up questions</h2>
        <p>
          <strong>"Would a dedicated vector database have been better?"</strong> At larger scale,
          likely yes for raw performance and specialized features. At this project's actual scale,
          pgvector's tradeoff (one database instead of two systems) was the right call, not a
          strictly superior one.
        </p>
        <p>
          <strong>"Why not just use one language for the whole backend?"</strong> Python has
          meaningfully better tooling for the embedding/NLP-heavy work; forcing that into Node would
          have meant reimplementing that ecosystem badly. The operational cost of two runtimes was
          worth paying here.
        </p>
        <p>
          <strong>"Tell me about a real bug you found and fixed."</strong> The filesystem-dependency
          bug above is the strongest one: found via a deliberate, adversarial test (delete the
          directory, restart cold, see what actually breaks), root-caused correctly on the first
          pass, fixed architecturally rather than patched, and verified three separate ways before
          calling it done (a locally-built production image, then the real deployed production URL).
        </p>
        <p>
          <strong>"How would this handle real production scale?"</strong> Cloud Run's infrastructure
          already handles meaningful concurrency. The one real scaling risk found (Postgres
          connection pooling) was found and fixed before it caused a real incident, by proactively
          testing for it.
        </p>
        <p>
          <strong>"What would you do differently next time?"</strong> Set up the pooled Postgres
          connection, the correct Cloud Run ingress/auth settings, and database-backed knowledge-base
          storage from the very first implementation, rather than discovering each one live. All
          three are now documented in this project's own deployment and knowledge-base guides
          specifically so a future setup doesn't repeat the same discovery process.
        </p>
      </TextbookPage>
    </div>
  );
}
