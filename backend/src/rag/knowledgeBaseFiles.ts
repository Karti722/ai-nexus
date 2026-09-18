import { getDocument, listDocuments } from "./vectorStore";

/**
 * Knowledge-base titles and full article content, served from the
 * `documents` table (see vectorStore.ts) rather than reading
 * backend/data/knowledge-base off disk. That directory is only ever read at
 * seed time (seedDocuments.ts); once seeded, the database is the single
 * source of truth, so this module has no filesystem dependency and works
 * identically whether or not the source markdown files happen to exist on
 * the running container.
 */

export interface KnowledgeBaseFileMeta {
  source: string;
  title: string;
}

export interface KnowledgeBaseFile extends KnowledgeBaseFileMeta {
  content: string;
}

export async function listKnowledgeBaseFiles(): Promise<KnowledgeBaseFileMeta[]> {
  return listDocuments();
}

export async function getKnowledgeBaseTitle(source: string): Promise<string> {
  const doc = await getDocument(source);
  return doc?.title ?? source;
}

export async function readKnowledgeBaseFile(source: string): Promise<KnowledgeBaseFile | null> {
  return getDocument(source);
}
