import { Router } from "express";
import { evaluateOutput } from "../eval/evalClient";
import { describeError } from "../utils/errors";

export const evalRouter = Router();

/**
 * POST /api/evaluate
 * body: { candidate: string, reference: string }
 * Scores a candidate answer against a reference using exact match, a
 * ROUGE-L overlap score, and embedding-based semantic similarity.
 */
evalRouter.post("/", async (req, res) => {
  const { candidate, reference } = req.body as { candidate?: string; reference?: string };

  if (!candidate || typeof candidate !== "string" || !reference || typeof reference !== "string") {
    return res.status(400).json({ error: "Request body must include 'candidate' and 'reference' strings." });
  }

  try {
    const result = await evaluateOutput(candidate, reference);
    res.json(result);
  } catch (err) {
    console.error("[evaluate] error:", err);
    res.status(500).json({ error: `Failed to evaluate the output: ${describeError(err)}` });
  }
});
