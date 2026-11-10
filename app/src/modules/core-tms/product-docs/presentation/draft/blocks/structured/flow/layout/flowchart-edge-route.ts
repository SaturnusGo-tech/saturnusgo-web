import type { ElkExtendedEdge, ElkPoint } from "elkjs/lib/elk-api";

export interface FlowchartEdgeRoute {
  path: string;
  start: ElkPoint;
  end: ElkPoint;
  labelX?: number;
  labelY?: number;
}

function toward(from: ElkPoint, to: ElkPoint) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const fraction = distance ? Math.min(18 / distance, 0.5) : 0;
  return `${from.x + (to.x - from.x) * fraction},${from.y + (to.y - from.y) * fraction}`;
}

function singleBendCurve([start, first, second, end]: ElkPoint[]) {
  if (first.x === second.x && first.y === start.y && second.y === end.y
    && (first.x - start.x) * (end.x - first.x) > 0) {
    return ` C ${first.x},${start.y} ${second.x},${end.y} ${end.x},${end.y}`;
  }
  if (first.y === second.y && first.x === start.x && second.x === end.x
    && (first.y - start.y) * (end.y - first.y) > 0) {
    return ` C ${start.x},${first.y} ${end.x},${second.y} ${end.x},${end.y}`;
  }
}

export function flowchartEdgeRoute(edge: ElkExtendedEdge, offset: ElkPoint): FlowchartEdgeRoute | undefined {
  if (edge.sections?.length !== 1) return;
  const { startPoint, bendPoints = [], endPoint } = edge.sections[0];
  const points = [startPoint, ...bendPoints, endPoint].map(point => ({ x: point.x + offset.x, y: point.y + offset.y }));
  let path = `M ${points[0].x},${points[0].y}`;
  const curve = points.length === 4 ? singleBendCurve(points) : undefined;
  if (curve) path += curve;
  else {
    for (let i = 1; i < points.length - 1; i++) {
      const corner = points[i];
      path += ` L ${toward(corner, points[i - 1])} Q ${corner.x},${corner.y} ${toward(corner, points[i + 1])}`;
    }
    const end = points[points.length - 1];
    path += ` L ${end.x},${end.y}`;
  }
  const label = edge.labels?.[0];
  return {
    path,
    start: points[0],
    end: points[points.length - 1],
    labelX: label?.x === undefined ? undefined : offset.x + label.x + (label.width ?? 0) / 2,
    labelY: label?.y === undefined ? undefined : offset.y + label.y + (label.height ?? 0) / 2,
  };
}
