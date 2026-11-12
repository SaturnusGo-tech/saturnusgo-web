import type { ElkExtendedEdge, ElkPoint } from "elkjs/lib/elk-api";

export interface FlowchartEdgeRoute {
  path: string;
  start: ElkPoint;
  end: ElkPoint;
  labelX?: number;
  labelY?: number;
  labelWidth?: number;
  labelHeight?: number;
}

function toward(from: ElkPoint, to: ElkPoint, radius: number) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const fraction = distance ? radius / distance : 0;
  return `${from.x + (to.x - from.x) * fraction},${from.y + (to.y - from.y) * fraction}`;
}

function cleanRoute(points: ElkPoint[]) {
  const clean: ElkPoint[] = [];
  for (const point of points) {
    const last = clean[clean.length - 1];
    if (last && Math.hypot(last.x - point.x, last.y - point.y) < 0.01) continue;
    const before = clean[clean.length - 2];
    if (before && last) {
      const incoming = { x: last.x - before.x, y: last.y - before.y };
      const outgoing = { x: point.x - last.x, y: point.y - last.y };
      if (Math.abs(incoming.x * outgoing.y - incoming.y * outgoing.x) < 0.01
        && incoming.x * outgoing.x + incoming.y * outgoing.y > 0) clean.pop();
    }
    clean.push(point);
  }
  return clean;
}

export function flowchartEdgeRoute(edge: ElkExtendedEdge, offset: ElkPoint): FlowchartEdgeRoute | undefined {
  if (edge.sections?.length !== 1) return;
  const { startPoint, bendPoints = [], endPoint } = edge.sections[0];
  const points = cleanRoute([startPoint, ...bendPoints, endPoint].map(point => ({ x: point.x + offset.x, y: point.y + offset.y })));
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const corner = points[i];
    const radius = Math.min(18, Math.hypot(corner.x - points[i - 1].x, corner.y - points[i - 1].y) / 2,
      Math.hypot(corner.x - points[i + 1].x, corner.y - points[i + 1].y) / 2);
    // Keep ELK's obstacle/label corridor. Only the corner itself is rounded.
    path += ` L ${toward(corner, points[i - 1], radius)} Q ${corner.x},${corner.y} ${toward(corner, points[i + 1], radius)}`;
  }
  const end = points[points.length - 1];
  path += ` L ${end.x},${end.y}`;
  const label = edge.labels?.[0];
  return {
    path,
    start: points[0],
    end: points[points.length - 1],
    labelX: label?.x === undefined ? undefined : offset.x + label.x + (label.width ?? 0) / 2,
    labelY: label?.y === undefined ? undefined : offset.y + label.y + (label.height ?? 0) / 2,
    labelWidth: label?.width,
    labelHeight: label?.height,
  };
}
