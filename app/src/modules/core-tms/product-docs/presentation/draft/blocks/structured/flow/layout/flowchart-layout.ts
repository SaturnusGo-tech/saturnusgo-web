import ELK, { type ElkExtendedEdge, type ElkNode } from "elkjs/lib/elk.bundled.js";
import type { FlowchartModel } from "../model/flowchart-model";
import { flowchartEdgeRoute, type FlowchartEdgeRoute } from "./flowchart-edge-route";

type Node = FlowchartModel["nodes"][number];
type Group = FlowchartModel["groups"][number];
interface Box { id: string; x: number; y: number; width: number; height: number }
export interface FlowchartLayout {
  direction: FlowchartModel["direction"];
  preset?: FlowchartModel["preset"];
  bounds: { width: number; height: number };
  nodes: Array<(Node | Group) & Box>;
  edges: Array<FlowchartModel["edges"][number] & { route?: FlowchartEdgeRoute }>;
}

const nodeWidth = 224;
const widths = { procedure: 250, pipeline: 206, metrics: 256 };
const elk = new ELK();

function lineCount(text: string, font: string, size: number, textWidth: number, canvas: CanvasRenderingContext2D | null) {
  if (canvas) canvas.font = font;
  const width = (value: string) => canvas?.measureText(value).width ?? Array.from(value).length * size * 0.64;
  let lines = 1;
  let line = "";
  for (const word of text.trim().split(/\s+/u)) {
    const next = line ? `${line} ${word}` : word;
    if (width(next) <= textWidth) {
      line = next;
      continue;
    }
    if (line) lines++;
    line = "";
    // Very long, unbroken identifiers wrap with the same policy as the card.
    for (const letter of word) {
      if (width(line + letter) > textWidth) {
        lines++;
        line = "";
      }
      line += letter;
    }
  }
  return lines;
}

function nodeSizes({ nodes, preset }: FlowchartModel) {
  const width = preset ? widths[preset] : nodeWidth;
  const textWidth = width - 54;
  const canvas = typeof document === "undefined" ? null : document.createElement("canvas").getContext("2d");
  const labels = nodes.map(node => {
    const title = lineCount(node.label, "650 14px system-ui", 14, textWidth, canvas);
    const detail = node.detail ? lineCount(node.detail, "400 12px system-ui", 12, textWidth, canvas) : 0;
    const metricWidth = (width - 30) / (node.metrics?.length || 1) - 8;
    const metricHeight = Math.max(0, ...(node.metrics ?? []).map(field =>
      14 * lineCount(field.label, "400 11px system-ui", 11, metricWidth, canvas)
      + 17 * lineCount(field.value, "650 13px system-ui", 13, metricWidth, canvas)
      + 2
    ));
    return { id: node.id, title, detail, metricHeight };
  });
  const detailSpace = preset === "procedure" ? 11 : 4;
  const textHeight = (title: number, detail: number) => 18 * title + (detail ? detailSpace + 16 * detail : 0);
  const standardHeight = Math.max(54, ...labels.map(({ title, detail }) => textHeight(Math.min(3, title), Math.min(2, detail))));
  const insets = preset === "pipeline" ? 22 : 26;
  return new Map(labels.map(({ id, title, detail, metricHeight }) => [id, {
    width,
    height: insets + Math.max(preset === "pipeline" ? 35 : standardHeight, textHeight(title, detail))
      + (metricHeight ? 16 + metricHeight : 0),
  }]));
}

export async function layoutFlowchart(model: FlowchartModel): Promise<FlowchartLayout> {
  const sizes = nodeSizes(model);
  const ids = new Map([...model.groups, ...model.nodes].map((node, index) => [node.id, `node-${index}`]));
  const byParent = new Map<string | undefined, Array<Node | Group>>();
  for (const node of [...model.groups, ...model.nodes]) {
    const siblings = byParent.get(node.groupId) ?? [];
    siblings.push(node);
    byParent.set(node.groupId, siblings);
  }
  function children(parent?: string): ElkNode[] {
    return (byParent.get(parent) ?? []).map(node => {
      const id = ids.get(node.id)!;
      if ("kind" in node) return { id, ...sizes.get(node.id) };
      return {
        id,
        width: nodeWidth,
        height: 72,
        layoutOptions: { "elk.padding": "[top=38,left=22,bottom=22,right=22]" },
        children: children(node.id),
      };
    });
  }
  const edges: ElkExtendedEdge[] = model.edges.map(edge => ({
    id: edge.id,
    sources: [ids.get(edge.from)!],
    targets: [ids.get(edge.to)!],
    labels: edge.label ? [{ text: edge.label, width: Math.min(160, 17 + edge.label.length * 7), height: 22 }] : [],
  }));
  const graph = await elk.layout<ElkNode>({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": model.direction,
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.padding": "[top=16,left=16,bottom=16,right=16]",
      "elk.spacing.nodeNode": model.preset === "procedure" ? "28" : "36",
      "elk.layered.spacing.nodeNodeBetweenLayers": model.preset === "metrics" ? "88" : "72",
      "elk.layered.spacing.edgeNodeBetweenLayers": "18",
    },
    children: children(),
    edges,
  });
  const positions = new Map<string, Box>();
  const routedEdges = [...(graph.edges ?? [])];
  function readPositions(children: ElkNode[], x: number, y: number) {
    for (const node of children) {
      const left = x + (node.x ?? 0);
      const top = y + (node.y ?? 0);
      positions.set(node.id, { id: node.id, x: left, y: top, width: node.width ?? nodeWidth, height: node.height ?? 72 });
      routedEdges.push(...(node.edges ?? []));
      readPositions(node.children ?? [], left, top);
    }
  }
  readPositions(graph.children ?? [], 0, 0);
  const routes = new Map(routedEdges.map(edge => [edge.id, flowchartEdgeRoute(edge, positions.get(edge.container ?? "") ?? { x: 0, y: 0 })]));
  return {
    direction: model.direction,
    preset: model.preset,
    bounds: { width: graph.width ?? nodeWidth, height: graph.height ?? 72 },
    nodes: [...model.groups, ...model.nodes].map(node => ({
      ...node,
      ...positions.get(ids.get(node.id)!)!,
      id: node.id,
    })),
    edges: model.edges.map(edge => ({ ...edge, route: routes.get(edge.id) })),
  };
}
