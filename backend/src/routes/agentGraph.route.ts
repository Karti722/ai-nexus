import { Router } from "express";
import { runUserGraph } from "../agentGraph/buildAndRun";
import { NODE_CATALOG } from "../agentGraph/nodeCatalog";
import type { UserGraph } from "../agentGraph/types";
import { describeError } from "../utils/errors";

export const agentGraphRouter = Router();

/** GET /api/agent-graph/node-types — the palette the canvas draws from. */
agentGraphRouter.get("/node-types", (_req, res) => {
  res.json({ nodeTypes: NODE_CATALOG });
});

/**
 * POST /api/agent-graph/run
 * body: { question: string, graph: { nodes: {id, type}[], edges: {source, target}[] } }
 */
agentGraphRouter.post("/run", async (req, res) => {
  const { question, graph } = req.body as { question?: string; graph?: UserGraph };

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Request body must include a string 'question' field." });
  }
  if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    return res.status(400).json({ error: "Request body must include a 'graph' with 'nodes' and 'edges'." });
  }

  try {
    const result = await runUserGraph(graph, question);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: describeError(err) });
  }
});
