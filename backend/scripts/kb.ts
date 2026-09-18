import fs from "fs";
import path from "path";
import { chunkText } from "../src/rag/chunker";
import { embedTexts } from "../src/rag/embeddingsClient";
import {
  addChunk,
  deleteChunksBySource,
  deleteDocument,
  listDocuments,
  upsertDocument,
} from "../src/rag/vectorStore";

/**
 * Knowledge-base management CLI: add, update or remove a document straight
 * against whatever database POSTGRES_URL (in .env) currently points at.
 * There is no separate "seed" vs. "edit" path any more: this is the same
 * chunk-then-embed pipeline seedDocuments.ts uses, just for one document at
 * a time instead of the whole knowledge base at startup.
 *
 * Usage (from backend/):
 *   npm run kb -- upsert <path-to-markdown-file> [source-name]
 *   npm run kb -- remove <source-name>
 *   npm run kb -- list
 *
 * "upsert" both adds a brand-new article and updates an existing one: the
 * source name (default: the file's basename) is the key. Re-running upsert
 * on an edited file deletes that source's old chunks first, so a change to
 * chunk boundaries can't leave stale chunks sitting alongside the new ones.
 */

function extractTitle(markdown: string, fallback: string): string {
  const heading = markdown.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : fallback;
}

async function upsert(filePath: string, sourceOverride?: string): Promise<void> {
  const source = sourceOverride ?? path.basename(filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  const title = extractTitle(content, source);

  await deleteChunksBySource(source);
  const chunks = chunkText(content);
  const embeddings = await embedTexts(chunks, "document");
  for (let i = 0; i < chunks.length; i++) {
    await addChunk(source, chunks[i], embeddings[i]);
  }
  await upsertDocument(source, title, content);

  console.log(`Upserted "${source}" ("${title}") — ${chunks.length} chunk(s) embedded.`);
}

async function remove(source: string): Promise<void> {
  await deleteChunksBySource(source);
  await deleteDocument(source);
  console.log(`Removed "${source}" from the knowledge base.`);
}

async function list(): Promise<void> {
  const docs = await listDocuments();
  if (docs.length === 0) {
    console.log("(knowledge base is empty)");
    return;
  }
  for (const doc of docs) {
    console.log(`${doc.source}\t${doc.title}`);
  }
}

async function main(): Promise<void> {
  const [, , cmd, ...rest] = process.argv;

  switch (cmd) {
    case "upsert": {
      const [filePath, sourceOverride] = rest;
      if (!filePath) throw new Error("Usage: npm run kb -- upsert <path-to-markdown-file> [source-name]");
      await upsert(filePath, sourceOverride);
      break;
    }
    case "remove": {
      const [source] = rest;
      if (!source) throw new Error("Usage: npm run kb -- remove <source-name>");
      await remove(source);
      break;
    }
    case "list":
      await list();
      break;
    default:
      console.log("Usage: npm run kb -- <upsert|remove|list> [...args]");
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
