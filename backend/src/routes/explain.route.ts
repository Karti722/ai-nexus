import { Router } from "express";
import { explainApp } from "../explainer/buildAndRun";
import { describeError } from "../utils/errors";

export const explainRouter = Router();

/**
 * POST /api/explain
 * body: { question: string }
 * See info/personalized-explainer-spec.md.
 */
explainRouter.post("/", async (req, res) => {
  const { question } = req.body as { question?: string };

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Request body must include a string 'question' field." });
  }

  try {
    const result = await explainApp(question);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: describeError(err) });
  }
});
