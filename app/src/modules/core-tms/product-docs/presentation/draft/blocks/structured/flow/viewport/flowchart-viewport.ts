import type { Viewport } from "@xyflow/react";

export function flowchartInitialViewport(bounds: { width: number; height: number }, width: number, height: number): Viewport {
  const margin = 20;
  const zoom = Math.max(0.05, Math.min(1,
    Math.max(1, width - margin * 2) / Math.max(1, bounds.width),
    Math.max(1, height - margin * 2) / Math.max(1, bounds.height)));
  return { x: (width - bounds.width * zoom) / 2, y: (height - bounds.height * zoom) / 2, zoom };
}
