import {
  flowEdgeKey, flowNodeTone, flowOutcomeTone, flowPipelineTone, readFlowchartStyle,
  type FlowMetric, type FlowPreset, type FlowTone,
} from "./flowchart-style";

export type FlowDirection = "RIGHT" | "LEFT" | "DOWN" | "UP";

export interface MermaidFlowData {
  direction?: string;
  nodes: ReadonlyArray<{ id: string; text?: string; type?: string; labelType?: string; icon?: string; img?: string }>;
  edges: ReadonlyArray<{ start: string; end: string; text?: string; type?: string; stroke?: string; labelType?: string }>;
  groups: ReadonlyArray<{ id: string; title: string; nodes: string[]; dir?: string; metadata?: { view?: string }; labelType?: string }>;
}

export interface FlowchartModel {
  direction: FlowDirection;
  preset?: FlowPreset;
  nodes: ReadonlyArray<{
    id: string; label: string; detail?: string; metrics?: FlowMetric[]; kind: "step" | "decision" | "terminal" | "storage" | "subprocess";
    tone: FlowTone; groupId?: string;
  }>;
  edges: ReadonlyArray<{
    id: string; from: string; to: string; label: string; tone: FlowTone; arrow: "none" | "end" | "both";
  }>;
  groups: ReadonlyArray<{ id: string; label: string; groupId?: string }>;
}

const directions: Record<string, FlowDirection> = {
  LR: "RIGHT", RL: "LEFT", TB: "DOWN", TD: "DOWN", BT: "UP",
};
const arrows: Record<string, FlowchartModel["edges"][number]["arrow"]> = {
  arrow_point: "end", arrow_open: "none", double_arrow_point: "both",
};
const shapeKind: Record<string, FlowchartModel["nodes"][number]["kind"]> = {
  diamond: "decision", question: "decision", stadium: "terminal", circle: "terminal",
  doublecircle: "terminal", cylinder: "storage", subroutine: "subprocess",
  square: "step", rect: "step", round: "step",
};

function plainLabel(value: string) {
  return value.replace(/<br\s*\/?\s*>/giu, " ").replace(/\s+/gu, " ").trim();
}

export function createFlowchartModel(data: MermaidFlowData, source: string): FlowchartModel | undefined {
  const direction = directions[data.direction ?? "TB"];
  if (!direction || !data.nodes.length || data.nodes.length > 300 || data.edges.length > 300) return;
  const style = readFlowchartStyle(source);
  const nodeIds = new Set(data.nodes.map(node => node.id));
  const groupIds = new Set(data.groups.map(group => group.id));
  const groupOf = new Map<string, string>();
  for (const group of data.groups) {
    if (nodeIds.has(group.id) || group.metadata?.view || group.labelType === "markdown"
      || (group.dir && directions[group.dir] !== direction)) return;
    for (const member of group.nodes) {
      if (groupOf.has(member) || (!nodeIds.has(member) && !groupIds.has(member))) return;
      groupOf.set(member, group.id);
    }
  }
  for (const group of data.groups) {
    const path = new Set([group.id]);
    for (let parent = groupOf.get(group.id); parent; parent = groupOf.get(parent)) {
      if (path.has(parent)) return;
      path.add(parent);
    }
  }
  if (data.nodes.some(node => (node.type && !Object.prototype.hasOwnProperty.call(shapeKind, node.type)) || node.icon || node.img || node.labelType === "markdown")) return;
  if (data.edges.some(edge => !nodeIds.has(edge.start) || !nodeIds.has(edge.end)
    || (edge.type && !Object.prototype.hasOwnProperty.call(arrows, edge.type)) || edge.stroke === "invisible" || edge.labelType === "markdown")) return;

  return {
    direction: style.preset === "procedure" ? "DOWN" : style.preset ? "RIGHT" : direction,
    preset: style.preset,
    nodes: data.nodes.map(node => {
      const label = plainLabel(node.text ?? node.id);
      return {
        id: node.id, label, detail: style.details.get(node.id), kind: shapeKind[node.type ?? "square"],
        metrics: style.preset === "metrics" ? style.metrics.get(node.id) : undefined,
        tone: style.nodes.get(node.id) ?? flowNodeTone(label, node.type), groupId: groupOf.get(node.id),
      };
    }),
    edges: data.edges.map((edge, index) => {
      const label = plainLabel(edge.text ?? "");
      return {
        id: `edge-${index}`, from: edge.start, to: edge.end, label,
        tone: style.edges.get(flowEdgeKey(edge.start, edge.end)) ?? flowOutcomeTone(label)
          ?? (style.preset === "pipeline" ? flowPipelineTone(label) : undefined) ?? style.nodes.get(edge.end) ?? "neutral",
        arrow: arrows[edge.type ?? "arrow_point"],
      };
    }),
    groups: data.groups.map(group => ({ id: group.id, label: plainLabel(group.title), groupId: groupOf.get(group.id) })),
  };
}
