import { Router } from "express";
import { explainTermWithLangChain } from "../explainer/langchainOnly";
import { describeError } from "../utils/errors";

export const langchainDemoRouter = Router();

/**
 * POST /api/langchain-demo
 * body: { term: string }
 * The LangChain-only counterpart to /api/explain's LangGraph workflow.
 */
langchainDemoRouter.post("/", async (req, res) => {
  const { term } = req.body as { term?: string };

  if (!term || typeof term !== "string") {
    return res.status(400).json({ error: "Request body must include a string 'term' field." });
  }

  try {
    const result = await explainTermWithLangChain(term);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: describeError(err) });
  }
});
