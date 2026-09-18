# Managing the knowledge base (adding, editing, removing documents)

This guide explains, from a completely blank starting point, how to add, edit, or remove an
article from this app's knowledge base: the set of documents Chapter 3 (RAG), Chapter 4 (the AI
agent's search tool), and Chapter 11 (the personalized explainer) all retrieve real answers from.
It assumes no prior context about this app at all, so it starts with what the knowledge base
actually *is* before getting to the commands.

If you just want the commands and already understand the concepts below, skip to
["The three operations"](#the-three-operations).

## 1. What the knowledge base actually is

This app answers questions using **Retrieval-Augmented Generation (RAG)**: instead of trusting an
LLM to already know the answer, it first searches a set of real reference articles for the most
relevant passages, then asks the LLM to answer using only what it found, citing which article each
part of the answer came from. (Chapter 3 of the app itself, `/rag`, demonstrates this live and
explains the concept in more depth than this guide will; `info/codebase.md` and
`06-vector-databases.md`, one of the very articles this guide is about, cover the underlying theory.)

For that search step to work, every article first has to be broken into small pieces and converted
into a form a computer can compare for *meaning*, not just matching keywords. That happens once,
whenever an article is added or changed, not on every question asked. Concretely:

1. **Chunking** — a long article is split into overlapping passages a few hundred characters each
   (`backend/src/rag/chunker.ts`), so the app can retrieve just the relevant paragraph of an
   article instead of the whole thing.
2. **Embedding** — each chunk is sent to Voyage AI's embedding model (via this project's own
   `python-service`) and comes back as a list of ~1,000 numbers, a **vector**, positioned in space
   such that chunks with similar *meaning* end up near each other, even if they don't share any of
   the same words.
3. **Storage** — every chunk's text and its vector are saved as one row in a Postgres database
   (hosted on **Neon**, a cloud Postgres provider) that has the **pgvector** extension installed,
   which adds native support for storing vectors and searching by similarity directly in SQL.

At query time (e.g. someone asking a question on `/rag`), the app embeds *that question* the same
way, asks Postgres for the chunks whose vectors are closest to it, and hands those chunks to the
LLM as context. None of that query-time process is what this guide is about; this guide is about
step 1–3 above, the one-time work of getting an article *into* that database in the first place, or
changing/removing one that's already there.

### The two database tables involved

Everything above lives in exactly two tables, both inside the same Neon Postgres database:

| Table | What it stores | What it's used for |
|---|---|---|
| `chunks` | One row per chunk: which article it came from (`source`), the chunk's text, and its embedding vector. | The actual similarity search every RAG answer runs. |
| `documents` | One row per *article*: its filename (`source`), a display title, and the full original content. | Showing a readable title next to each citation, and the "browse the knowledge base" article viewer in the app. |

Both tables key off the same `source` value (the article's filename, e.g. `02-rag.md`), which is
why every operation below touches both tables together, never just one. (Earlier in this app's
development, article titles and full content were read directly from `.md` files on disk instead
of from the `documents` table. That turned out to be fragile — a production RAG query would crash
if those files were ever missing from the deployed server — so the app was changed to keep
everything in the database instead. `info/codebase.md`'s bug-fix history covers this in more
detail; this guide only covers how things work *today*.)

### Where this database actually lives

There is exactly one Neon Postgres database involved here for this project, and both your local
development setup and the live, deployed app read from and write to **the same one**. This is
important and worth repeating: **there is no separate "staging" database.** Whatever you do with
the tool in this guide takes effect on the live app immediately, with no extra deploy step, because
the app reads from this database on every request rather than baking the knowledge base into its
code. See ["Testing a change safely first"](#5-optional-testing-a-change-safely-first-before-touching-the-real-database)
near the end of this guide if you'd rather not risk that for a particular change.

## 2. Prerequisites (do this once)

Before running any command in this guide, you need:

1. **A local clone of this repository**, with dependencies installed. If you haven't done this
   yet, see `info/codebase.md`'s setup section first, then come back here.
2. **A `.env` file in the repo root** (copied from `.env.example` if you don't have one yet) with
   a real `POSTGRES_URL` value: the connection string for the Neon database described above. If
   this is blank or missing, the tool in this guide will fail to connect. If you don't have this
   value, it's the same one `backend`'s deployment already uses; see `info/deployment.md`'s
   environment variable table (`POSTGRES_URL`) for where it comes from and what it looks like.
3. **A real `VOYAGE_API_KEY` value in that same `.env` file.** Unlike this app's LLM calls, which
   fall back to a labeled "mock mode" if `ANTHROPIC_API_KEY` is missing, there is no offline
   fallback for embeddings anywhere in this app. Without a working Voyage key, every command below
   that needs to embed text (adding or editing an article) will fail outright.
4. **`python-service` running.** Embedding text doesn't happen inside the tool in this guide
   directly; it calls this project's own Python microservice (`python-service/`), which in turn
   calls Voyage AI's API. Start it, along with everything else, by running this from the repo root:
   ```bash
   npm run dev
   ```
   You don't need the frontend or the agent's MCP server running just to manage the knowledge
   base, but `npm run dev` starts everything together and that's the simplest way to make sure
   `python-service` in particular is up. You'll see a line like
   `[PYTHON] INFO:     Uvicorn running on http://127.0.0.1:8001` in the terminal once it's ready.
   Leave that terminal window running for the rest of this guide.

Everything from here on runs in a **second terminal window**, from inside the `backend/` folder:

```bash
cd backend
```

## 3. The tool: `npm run kb`

All three operations go through one script, `backend/scripts/kb.ts`, run via `npm run kb`. It
reuses the exact same chunking and embedding code the app itself uses to seed its knowledge base
on first startup (`backend/src/rag/seedDocuments.ts`), just applied to one article at a time
instead of all of them at once, so there's no separate, possibly-inconsistent code path for manual
edits versus the initial setup.

Every command below follows this shape:

```bash
npm run kb -- <command> [arguments]
```

The extra `--` is not a typo: it's how `npm` tells the difference between arguments meant for
`npm` itself and arguments meant to be passed through to the script. Always include it.

## 4. The three operations

### Listing what's currently in the knowledge base

Run this any time, it only reads from the database and can't change anything:

```bash
npm run kb -- list
```

Expected output looks like this (one line per article currently stored):

```
01-llms.md      Large Language Models (LLMs)
02-rag.md       Retrieval-Augmented Generation (RAG)
03-prompt-engineering.md       Prompt Engineering
...
```

If you see `(knowledge base is empty)` instead, either `POSTGRES_URL` is pointing at the wrong
database, or nothing has been seeded into this one yet.

### Adding a new article

1. **Write the article as a plain Markdown file**, anywhere on your computer (it does not need to
   be inside this repository). Two things matter about its formatting:
   - **The very first line should be a level-1 heading**, e.g. `# My New Topic`. This becomes the
     article's display title everywhere in the app (citations, the article browser). If you skip
     this, the article's filename is used as its title instead, which is a valid fallback but a
     worse-looking one.
   - Keep it reasonably close in length and style to the existing articles in
     `backend/data/knowledge-base/` (a few paragraphs, one topic). This isn't a hard requirement,
     but the chunking step (see Section 1) is tuned for short, focused articles like the existing
     ones, and RAG retrieval quality is generally better with several focused articles than one
     very long one.
2. **Pick a source name.** This is the short identifier (e.g. `08-fine-tuning.md`) that appears in
   citations and is how you'll refer to this article in every future command, including editing or
   removing it later. By default, the tool uses the actual filename of the file you wrote in step
   1. If you'd rather use a different, cleaner name than your local filename, you can specify it
   explicitly (shown below).
3. **Run the upsert command:**
   ```bash
   npm run kb -- upsert path/to/your-file.md
   ```
   Or, to use a source name different from the file's actual filename:
   ```bash
   npm run kb -- upsert path/to/your-file.md 08-fine-tuning.md
   ```
4. **Expected output:**
   ```
   Upserted "08-fine-tuning.md" ("Fine-Tuning vs. RAG") — 3 chunk(s) embedded.
   ```
   This confirms the title it extracted and how many chunks your article was split into. If this
   command instead prints an error, see ["Troubleshooting"](#6-troubleshooting) below.
5. **Verify it worked:**
   ```bash
   npm run kb -- list
   ```
   Your new source and title should now appear in the list.

That's it. No restart, no redeploy: the next question asked on `/rag` (locally or on the live
site) can immediately retrieve from this new article.

### Modifying (editing) an existing article

This is the exact same command as adding a new one: **`upsert` means "add if it doesn't exist yet,
replace if it does."** The article's `source` name is what decides which of those two happens.

1. Edit your local copy of the article's Markdown content (whatever file you originally wrote, or
   a fresh export/copy of it — the tool only ever looks at the file path you give it, not at
   anything already in the database).
2. Run the same command as before, with the **same source name** the article already has:
   ```bash
   npm run kb -- upsert path/to/your-edited-file.md 08-fine-tuning.md
   ```
3. Behind the scenes, this deletes every existing chunk for that source first, then re-chunks and
   re-embeds the new content from scratch, so you never end up with a mix of old and new chunks
   for the same article. The `documents` table's title and content are simply overwritten.
4. Verify with `npm run kb -- list` (the title will have updated if you changed the heading), or by
   asking a related question on `/rag` and confirming the citation shows your new wording.

### Removing an article

```bash
npm run kb -- remove 08-fine-tuning.md
```

Use the exact `source` name as it appears in `npm run kb -- list`, not the original local filename
you may have used when first adding it (only relevant if you used the optional second argument in
step 3 of "Adding a new article" above to make those two different).

Expected output:

```
Removed "08-fine-tuning.md" from the knowledge base.
```

This deletes every chunk for that source from the `chunks` table and its row from the `documents`
table. It does **not** touch any local `.md` file on your computer, whether that file lives inside
this repository or wherever you originally wrote it; "removing" here only ever means removing it
from the database the running app actually reads from.

## 5. (Optional) Testing a change safely first, before touching the real database

Every command above writes immediately to the one real Neon database this app's deployed version
also reads from (see ["Where this database actually lives"](#where-this-database-actually-lives)).
For a small wording fix that's usually fine. If you want to try something riskier, like a large
new article you're not sure reads well yet, without affecting the live site while you iterate:

1. Create a second, free Neon project at [console.neon.tech](https://console.neon.tech) (see
   `info/deployment.md`'s Step 1 for the exact clicks) purely as a scratch space.
2. Temporarily change `POSTGRES_URL` in your local `.env` file to that new project's connection
   string instead of the real one.
3. Run whichever `npm run kb` commands you want against it freely; this new database starts empty,
   so `npm run dev`'s normal startup will actually re-seed the whole knowledge base into it from
   `backend/data/knowledge-base/` the first time you run the app against it (see
   `backend/src/rag/seedDocuments.ts`), giving you a realistic copy to experiment on.
4. Once you're happy with the result, change `POSTGRES_URL` back to the real connection string,
   and re-run the same `npm run kb -- upsert` command(s) against the real database to apply the
   now-confirmed change for real.
5. Delete the scratch Neon project once you're done with it (optional, but tidy — Neon's free tier
   allows only a limited number of projects at once).

## 6. Troubleshooting

| Symptom | What it means | Fix |
|---|---|---|
| `Error: connect ETIMEDOUT` or the command hangs for a long time before failing | `POSTGRES_URL` is missing, wrong, or the Neon project is asleep (Neon's free tier scales to zero after inactivity and can take a few seconds to wake up) | Double-check `POSTGRES_URL` in `.env`; if it looks correct, just try the command again, a cold Neon instance usually wakes up within the tool's own timeout on a second attempt |
| `fetch failed` during `upsert` | The tool couldn't reach `python-service` to generate embeddings | Make sure `npm run dev` (or at least `python-service` on its own) is actually running in another terminal, per [Prerequisites](#2-prerequisites-do-this-once) |
| `embedding service responded 401` or similar | `VOYAGE_API_KEY` is missing or invalid | Check `VOYAGE_API_KEY` in `.env`; get a real key from Voyage AI's dashboard if you don't have one |
| `ENOENT: no such file or directory` | The file path you gave `upsert` doesn't exist, or has a typo | Double check the path; it's relative to whatever folder your terminal is currently in, not to `backend/` automatically |
| `npm run kb -- list` prints `(knowledge base is empty)` unexpectedly | `POSTGRES_URL` points at a different (probably empty) database than the one you expect | Compare the hostname in your `.env`'s `POSTGRES_URL` against the one in your Neon dashboard |
| An article you removed still shows up in an answer's citations | The running backend process cached something from before the removal (rare) | Restart the backend (`npm run dev`, or just the one process) and try again |
