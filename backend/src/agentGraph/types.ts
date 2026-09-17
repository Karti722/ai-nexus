/** The fixed set of node types a user can drop onto the canvas. Tool node
 * types map 1:1 onto real tools already used by the hand-built agent in
 * agent/tools.ts and agent/mcpClient.ts: this feature is a different way to
 * run the same real capabilities, not a reimplementation of them. */
export type NodeType =
  | "start"
  | "end"
  | "reasoning"
  | "tool_calculator"
  | "tool_knowledge_base"
  | "tool_weather"
  | "tool_current_time";

export interface UserGraphNode {
  id: string;
  type: NodeType;
}

export interface UserGraphEdge {
  source: string;
  target: string;
}

export interface UserGraph {
  nodes: UserGraphNode[];
  edges: UserGraphEdge[];
}

export interface GraphTraceStep {
  nodeId: string;
  nodeType: NodeType;
  summary: string;
}

export interface RunGraphResult {
  trace: GraphTraceStep[];
  finalAnswer: string;
}
