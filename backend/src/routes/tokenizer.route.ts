import { Router } from "express";
import { tokenizeText } from "../tokenizer/tokenizerClient";
import { describeError } from "../utils/errors";

export const tokenizerRouter = Router();

/**
 * POST /api/tokenize
 * body: { text: string }
 * Runs a real, from-scratch BPE tokenizer over the input and returns the
 * token count alongside per-model cost estimates at published rates.
 */
tokenizerRouter.post("/", async (req, res) => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Request body must include a string 'text' field." });
  }

  try {
    const result = await tokenizeText(text);
    res.json(result);
  } catch (err) {
    console.error("[tokenize] error:", err);
    res.status(500).json({ error: `Failed to tokenize the text: ${describeError(err)}` });
  }
});
