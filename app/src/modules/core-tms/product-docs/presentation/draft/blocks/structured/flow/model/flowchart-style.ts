export type FlowTone = "neutral" | "blue" | "teal" | "green" | "amber" | "red" | "violet";

export type FlowPreset = "procedure" | "pipeline" | "metrics";
export interface FlowMetric { label: string; value: string }

const presetStyle = /^\s*%%\s+falcon-preset\s+(procedure|pipeline|metrics)\s*$/u;
const nodeMetric = /^\s*%%\s+falcon-metric\s+([\p{L}\p{N}_.-]+)\s+([^|\p{Cc}<>]+)\|([^|\p{Cc}<>]+)$/u;

const tones = new Set<string>(["neutral", "blue", "teal", "green", "amber", "red", "violet"]);
const nodeStyle = /^\s*%%\s+falcon-style\s+([\p{L}\p{N}_.-]+)\s+(\w+)\s*$/u;
const edgeStyle = /^\s*%%\s+falcon-edge\s+([\p{L}\p{N}_.-]+)\s+([\p{L}\p{N}_.-]+)\s+(\w+)\s*$/u;
const nodeDetail = /^\s*%%\s+falcon-detail\s+([\p{L}\p{N}_.-]+)\s+([^\p{Cc}<>]+?)\s*$/u;

export const flowEdgeKey = (from: string, to: string) => JSON.stringify([from, to]);

export function readFlowchartStyle(source: string) {
  const nodes = new Map<string, FlowTone>();
  const edges = new Map<string, FlowTone>();
  const details = new Map<string, string>();
  const metrics = new Map<string, FlowMetric[]>();
  let preset: FlowPreset | undefined;
  for (const line of source.split(/\r?\n/)) {
    const presetMatch = presetStyle.exec(line);
    if (presetMatch) preset ??= presetMatch[1] as FlowPreset;
    const node = nodeStyle.exec(line);
    if (node && tones.has(node[2])) nodes.set(node[1], node[2] as FlowTone);
    const edge = edgeStyle.exec(line);
    if (edge && tones.has(edge[3])) edges.set(flowEdgeKey(edge[1], edge[2]), edge[3] as FlowTone);
    const detail = nodeDetail.exec(line);
    if (detail && Array.from(detail[2]).length <= 100) details.set(detail[1], detail[2]);
    const metric = nodeMetric.exec(line);
    if (metric) {
      const [, nodeId, rawLabel, rawValue] = metric;
      const label = rawLabel.trim();
      const value = rawValue.trim();
      const fields = metrics.get(nodeId) ?? [];
      if (label && value && Array.from(label).length <= 28 && Array.from(value).length <= 18
        && fields.length < 3 && !fields.some(field => field.label === label)) {
        metrics.set(nodeId, [...fields, { label, value }]);
      }
    }
  }
  return { nodes, edges, details, preset, metrics };
}

function contains(value: string, pattern: RegExp) {
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${pattern.source})(?:$|[^\\p{L}\\p{N}])`, "iu").test(value);
}

export function flowOutcomeTone(label: string): FlowTone | undefined {
  if (contains(label, /no|false|denied|fail(?:ed|ure)?|invalid|error|rejected|нет|ошибка|отказ|отклонено|неверно/)) return "red";
  if (contains(label, /retry|wait(?:ing)?|blocked|timeout|повтор|ожидание|заблокировано|тайм-аут/)) return "amber";
  if (contains(label, /yes|true|success(?:ful)?|pass(?:ed)?|approved|allowed|valid|да|успех|разрешено|одобрено/)) return "green";
}

export function flowNodeTone(label: string, shape: string | undefined): FlowTone {
  if (shape === "diamond" || shape === "question") return "amber";
  const outcome = flowOutcomeTone(label);
  if (outcome) return outcome;
  if (shape === "stadium" || shape === "circle" || shape === "doublecircle") return "blue";
  if (shape === "cylinder") return "teal";
  if (shape === "subroutine") return "violet";
  return "neutral";
}

const pipelineTones: ReadonlyArray<[RegExp, FlowTone]> = [
  [/json|http|https|rest|graphql/, "blue"],
  [/sql|database|row[s]?|record[s]?|table[s]?/, "teal"],
  [/event[s]?|webhook[s]?|queue|message[s]?/, "violet"],
  [/file[s]?|csv|image[s]?|pdf/, "amber"],
];

export function flowPipelineTone(label: string): FlowTone | undefined {
  return pipelineTones.find(([pattern]) => contains(label, pattern))?.[1];
}
