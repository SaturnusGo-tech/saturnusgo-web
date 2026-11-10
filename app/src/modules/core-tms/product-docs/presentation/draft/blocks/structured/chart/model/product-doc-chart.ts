export const productDocChartLanguage = "falcon-chart";
export const maximumChartSource = 100_000;
export const chartPriorities = ["critical", "high", "medium", "low"] as const;

type ChartPriority = typeof chartPriorities[number];
export type ChartPoint = { label: string; priority: ChartPriority; days: number; href?: string };
export type LeadTimeChart = { version: 1; kind: "lead-time"; title: string; points: ChartPoint[] };

const recordKey = /^[a-z0-9][a-z0-9._:-]{0,127}$/i;
const workPath = /^\/(?:testcases\/[a-z0-9_-]+\/)?work\/?$/i;
const allowedLinkParams = new Set(["view", "projectId", "workspaceId", "defectId", "archivedDefect"]);

function safeDefectHref(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.length > 1_024) return undefined;
  const url = new URL(value, "https://falcon.invalid");
  if (url.origin !== "https://falcon.invalid" || !workPath.test(url.pathname) || url.hash || url.searchParams.get("view") !== "reports") return undefined;
  if (Array.from(url.searchParams.keys()).some((key) => !allowedLinkParams.has(key) || url.searchParams.getAll(key).length !== 1)) return undefined;
  if (!recordKey.test(url.searchParams.get("projectId") ?? "") || !recordKey.test(url.searchParams.get("defectId") ?? "")) return undefined;
  const workspaceId = url.searchParams.get("workspaceId");
  const archived = url.searchParams.get("archivedDefect");
  if ((workspaceId !== null && !recordKey.test(workspaceId)) || (archived !== null && archived !== "true")) return undefined;
  return `${url.pathname}${url.search}`;
}

export function isProductDocChartLanguage(value: string | null | undefined) {
  return value?.toLowerCase() === productDocChartLanguage;
}

function readPoint(value: unknown): ChartPoint | undefined {
  if (!value || typeof value !== "object") return undefined;
  const { label, priority, days, href } = value as Partial<ChartPoint>;
  if (typeof label !== "string" || !label.trim() || label.length > 220 || !priority || !chartPriorities.includes(priority)
    || typeof days !== "number" || !Number.isFinite(days) || days < 0 || days > 100_000) return undefined;
  const link = safeDefectHref(href);
  return { label: label.trim(), priority, days, ...(link ? { href: link } : {}) };
}

export function parseProductDocChart(source: string): LeadTimeChart | undefined {
  if (source.length > maximumChartSource) return undefined;
  try {
    const value = JSON.parse(source) as Partial<LeadTimeChart> | null;
    if (value?.version !== 1 || value.kind !== "lead-time" || typeof value.title !== "string" || !value.title.trim()
      || value.title.length > 120 || !Array.isArray(value.points) || value.points.length > 500) return undefined;
    const points = value.points.map(readPoint);
    if (!points.every((point): point is ChartPoint => Boolean(point))) return undefined;
    return { version: 1, kind: "lead-time", title: value.title.trim(), points };
  } catch {
    return undefined;
  }
}

export function positionChartPoints(points: ChartPoint[]) {
  const counts = new Map<string, number>();
  const positions = new Map<string, number>();
  const keyOf = (point: ChartPoint) => `${point.priority}:${point.days}`;
  for (const point of points) {
    const key = keyOf(point);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return points.map((point) => {
    const key = keyOf(point);
    const index = positions.get(key) ?? 0;
    positions.set(key, index + 1);
    const count = counts.get(key) ?? 1;
    const offset = count > 1 ? (index / (count - 1) - .5) * .52 : 0;
    return { ...point, position: chartPriorities.indexOf(point.priority) + offset };
  });
}
