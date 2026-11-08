import { maxRunEmbedWidth, minRunEmbedWidth, type RunEmbedPlacement } from "../../markdown/runDirective";

export function clampRunEmbedWidth(width: number): number {
  return Math.round(Math.min(maxRunEmbedWidth, Math.max(minRunEmbedWidth, width)));
}

export function resizeRunEmbedWidth(width: number, available: number, delta: number, align: NonNullable<RunEmbedPlacement["align"]>): number {
  const multiplier = align === "center" ? 2 : align === "right" ? -1 : 1;
  return clampRunEmbedWidth((width + delta * multiplier) / available * 100);
}
