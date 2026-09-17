# Spec: A Personalized, Diagram-Based App Explainer (Chapter 11)

**Status: implemented**, live at `/explain` and `/langgraph` (Chapter 11). This file is kept
as the design record explaining *why* it's built the way it is, the reasoning below (retrieve
before generating, Mermaid instead of raw diagram coordinates, voice output only, the two-page
split) still describes the actual current implementation, not a superseded plan. See
`codebase.md`'s own file-by-file section for where each piece actually lives in the repo.

---

## 1. The problem this solves

Chapter 9 already explains this app's architecture, but it does so the same way for every
reader: one fixed diagram, one fixed block of text, regardless of what that specific person
actually wants to understand. A newcomer and an engineer reading that page have different
questions in mind, and neither gets to ask theirs. Static documentation can't answer a
follow-up question, and the exact thing someone is confused about (say, "what happens
specifically when I ask a RAG question" or "how does the agent decide to call a tool") often
isn't the one thing a fixed diagram happened to illustrate.

This feature exists to close that gap: a reader asks their actual question, in their own
words, and gets back a diagram and explanation scoped to exactly what they asked, grounded
in this app's real architecture, not a canned page everyone sees identically.

It is deliberately **not** built to showcase a technology for its own sake. Every technical
choice below is justified by that problem, not the other way around.

## 2. Two entry points, one underlying tool

An earlier version of this idea (a drag-and-drop agent-graph builder, briefly built and then
removed) failed for a specific, instructive reason: it handed a new user a blank canvas and
assumed they'd know what to build. This spec is designed around not repeating that mistake,
and around a second failure mode caught during design review before any code was written:
a first-time visitor who clicks "explain this app to me" and lands on a page that then
explains an unrelated technical concept (LangGraph) is exactly as confused as before, just
about something new. Both are solved the same way: know who's actually looking at the page,
and don't hand them more than they asked for.

- **`/explain`** — a bare, standalone page. Just a question input, a "Generate" action, the
  resulting diagram and written explanation, and a plain link back to the homepage's table of
  contents once the reader is ready for more. No chapter eyebrow, no page number, no
  LangGraph explanation, nothing assuming the visitor has chosen to read a textbook yet. This
  is what the homepage callout (Section 6) links to. Same visual language as the rest of the
  app (paper background, same fonts and colors), just without the textbook framing.

- **`/langgraph`** (Chapter 11, reached normally through the table of contents like every
  other chapter) — the full textbook treatment: what LangChain and LangGraph actually are, how
  this specific feature is built with them, sources, and the same "In this demo" callout
  pattern every other chapter uses. Its own "Try it yourself" section embeds the *same*
  underlying tool as `/explain`, not a second implementation of it.

Concretely, this means one shared frontend component (working name `AppExplainer.tsx`)
containing the actual question input, diagram rendering, explanation display, and the
optional "Listen" button, imported by both page files. `/explain` renders it directly with no
chrome; `/langgraph` renders it inside the standard `TextbookPage` shell alongside the
LangChain/LangGraph explanation. One real feature, two page wrappers.

## 3. Why LangChain and LangGraph get explained in Chapter 11 specifically

Every other chapter in this app teaches the real technology behind its own demo: Chapter 3
explains RAG while demonstrating RAG, Chapter 4 explains MCP while using MCP. This feature is
built with LangGraph, so Chapter 11 explaining LangChain and LangGraph is the same pattern
applied consistently, not a bolted-on tech lecture. It also closes a real, current gap:
neither term appears anywhere else in this app today.

The `/explain` page deliberately does **not** include this explanation, for the reason in
Section 2: someone who hasn't chosen to read a textbook page yet doesn't need to know what
powers the tool they're using, the same way a visitor to any AI product's help widget doesn't
need a lecture on the model behind it before they can ask their question.

## 4. How a question actually becomes a diagram

The mechanism, in order:

1. **Retrieve real facts first, generate second.** The question is embedded and searched
   against the *same* knowledge base and vector store Chapter 3's RAG and Chapter 4's agent
   already use (`backend/src/rag/vectorStore.ts`, already populated, already proven reliable).
   This is a deliberate reuse, not a new curated "architecture facts" data source: the
   knowledge base already covers every concept in the app, and grounding the answer in real
   retrieved passages is what stops the model from inventing a data flow or a service that
   doesn't exist and presenting it as fact.
2. **Generate a Mermaid diagram definition, not raw diagram coordinates.** Having a model
   directly output pixel positions for a custom canvas is unreliable, this is the same
   category of risk that made the earlier drag-and-drop version hard to get right. The
   established pattern instead (used by Claude and ChatGPT themselves when asked to explain
   something visually, and by tools like Eraser.io's DiagramGPT) is to have the model produce
   a Mermaid definition, structured text describing which boxes exist and how they connect,
   and let a deterministic renderer (Mermaid.js) handle all actual layout. The model never
   controls pixels, only content.
3. **Generate a plain-language explanation** alongside the diagram, from the same retrieved
   context.
4. **Optionally read the explanation aloud.** A "Listen" button using the browser's built-in
   text-to-speech (`SpeechSynthesis` API, no server-side TTS service needed), a standard,
   low-risk accessibility pattern already common on documentation and content sites. This is
   the one piece of the original "voice" idea that survives design review: **output only**.
   Speech-to-text input was deliberately dropped, the reader still types their question using
   the same reliable input pattern every other chapter already uses; a microphone permission
   prompt on a page meant to help a confused visitor would add a new failure mode to a feature
   whose entire purpose is reducing confusion.

This is a genuine multi-step workflow (retrieve, generate a diagram, generate an explanation,
optionally speak it), which is why LangGraph is an appropriate tool for building it, unlike
the earlier version, where LangGraph's use had to be justified after the fact.

## 5. What this deliberately does not do

Listed explicitly because each one was considered and rejected during design review, not
overlooked:

- **No speech-to-text / voice input.** See Section 4, point 4.
- **No homepage-embedded UI.** Only a text link on the homepage (Section 6); the actual
  feature lives on its own page. Embedding a complex, generative feature directly on the page
  every visitor sees first was the core objection to the original pitch.
- **No blank-canvas interaction.** The reader asks a question in plain language; there is
  nothing to configure or construct before getting a result.
- **No new curated data source.** Grounding reuses the existing knowledge base and vector
  store rather than a separate "architecture facts" file, both to reduce build effort and
  because a second, parallel source of truth about the app's own architecture would risk
  drifting out of sync with the first.
- **No custom diagram-layout code.** Mermaid.js handles layout deterministically; the
  backend only ever produces Mermaid's text syntax.

## 6. Homepage change

A small, distinct callout near the top of the homepage, after the tagline and before the
"Table of Contents" divider (not buried at the bottom of an eleven-item list, where it
wouldn't reach the person it's actually for): a link to `/explain` labeled **"Generate a
personalized explanation of this app (recommended if reading is not your style)."** Chapter
11 additionally appears in its normal place in the table of contents, linking to `/langgraph`,
exactly like every other chapter.

## 7. Backend surface (as built)

- `POST /api/explain` (`backend/src/routes/explain.route.ts`) — body `{ question: string }`,
  returns `{ mermaidDefinition: string, explanation: string }`.
- The workflow itself (`backend/src/explainer/buildAndRun.ts`) is a **static**, three-node
  LangGraph `StateGraph` (`retrieve` → `diagram` → `explain`, fixed at build time), not a
  user-configurable graph like the earlier, removed prototype. That matters for more than
  simplicity: every node name is a compile-time string literal, so this graph needed none of
  the `as any` type-system workarounds the dynamic version required.
- No new environment variables or secrets: reuses the existing `ANTHROPIC_API_KEY` /
  `ANTHROPIC_MODEL` config and the existing Postgres/pgvector connection. The `top_p`
  library-compatibility issue found during the earlier prototype (`@langchain/anthropic`
  doesn't yet know about `claude-sonnet-5`, so it sends an invalid sentinel value unless the
  instance's `topP` property is forced to `undefined` directly) reappeared here, as expected,
  and got the same fix.

## 8. Resolved during implementation

The open questions from before implementation, and how each was actually resolved:

- **LangGraph node breakdown**: exactly the predicted three nodes (retrieve, diagram, explain),
  confirmed correct once built. TTS is handled entirely client-side (`AppExplainer.tsx`, via
  the browser's `SpeechSynthesis` API), not as a graph step, also as predicted.
- **Malformed Mermaid output**: models occasionally wrap Mermaid output in a markdown code
  fence despite being told not to; `buildAndRun.ts` strips this defensively before returning
  the definition. On the frontend, `mermaid.parse(..., { suppressErrors: true })` validates the
  definition before attempting to render it, showing a plain-text fallback message instead of a
  broken diagram if it's ever invalid, so a rendering failure degrades to "no diagram, but the
  real explanation is still there" rather than a broken page.
- **Rate limiting / cost**: not addressed with new code; this reuses the same Anthropic spend
  cap already covering every other Claude-calling feature (see `info/deployment.md`, "Good to
  know"), which was judged sufficient rather than adding feature-specific limits.

## 9. Caught after shipping

- **The diagram had no label.** The explanation below it has an "Explanation" heading; the
  diagram itself originally didn't, so a first-time user had no indication of what they were
  looking at. First fix was a "Diagram" heading plus one fixed sentence explaining, in general,
  that every diagram is generated fresh, not a set illustration. That was correct but generic,
  the same sentence regardless of what the diagram actually showed. The real fix: the `diagram`
  node's own prompt now asks the model for a one-sentence caption describing *that specific
  diagram's* content, alongside the Mermaid definition itself, in one call (`CAPTION: ...` /
  `DIAGRAM: ...`, parsed apart by `extractCaptionAndMermaid()` in `buildAndRun.ts`). Verified
  live: asking about semantic caching produced a caption naming the embedding/threshold/cache
  mechanism specifically, not a paraphrase of the generic sentence it replaced. The fixed
  sentence is kept as a fallback only, shown if a response ever doesn't include a parseable
  caption, so a formatting miss degrades gracefully instead of leaving the diagram unlabeled
  again.
