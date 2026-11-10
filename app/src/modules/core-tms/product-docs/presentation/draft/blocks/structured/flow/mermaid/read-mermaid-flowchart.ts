import type mermaid from "mermaid";
import { createFlowchartModel, type MermaidFlowData } from "../model/flowchart-model";

type FlowDb = {
  getDirection(): string;
  getVertices(): Map<string, MermaidFlowData["nodes"][number]>;
  getEdges(): MermaidFlowData["edges"];
  getSubGraphs(): MermaidFlowData["groups"];
};

export async function readMermaidFlowchart(renderer: typeof mermaid, source: string) {
  const header = source.split(/\r?\n/).find(line => line.trim() && !line.trimStart().startsWith("%%"));
  if (!header || !/^\s*(?:flowchart|graph)\b/u.test(header)) return;
  const diagram = await renderer.mermaidAPI.getDiagramFromText(source);
  const db = diagram.db as Partial<FlowDb>;
  if (!db.getVertices || !db.getEdges || !db.getDirection || !db.getSubGraphs) return;
  return createFlowchartModel({
    direction: db.getDirection(),
    nodes: [...db.getVertices().values()],
    edges: db.getEdges(),
    groups: db.getSubGraphs(),
  }, source);
}
