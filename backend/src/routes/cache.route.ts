import { Router } from "express";
import { simulateCache } from "../cache/cacheClient";
import { describeError } from "../utils/errors";

export const cacheRouter = Router();

/**
 * POST /api/cache-sim
 * body: { queries: string[], threshold?: number }
 * Replays a list of queries against an in-memory semantic cache, in order,
 * reporting which ones hit an existing (similar-enough) entry.
 */
cacheRouter.post("/", async (req, res) => {
  const { queries, threshold } = req.body as { queries?: string[]; threshold?: number };

  if (!Array.isArray(queries) || queries.some((q) => typeof q !== "string")) {
    return res.status(400).json({ error: "Request body must include a 'queries' array of strings." });
  }

  try {
    const result = await simulateCache(queries, threshold ?? 0.85);
    res.json(result);
  } catch (err) {
    console.error("[cache-sim] error:", err);
    res.status(500).json({ error: `Failed to run the cache simulation: ${describeError(err)}` });
  }
});
