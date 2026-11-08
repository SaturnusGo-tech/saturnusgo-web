import type { LeafDirective } from "mdast-util-directive";

export const runDirectiveName = "falcon-run";
export const runSnapshotPattern = /^runembed_[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
export const minRunEmbedWidth = 28;
export const maxRunEmbedWidth = 100;

export type RunEmbedPlacement = { width?: number; align?: "left" | "center" | "right" };

export function readRunEmbedPlacement(attributes?: { width?: unknown; align?: unknown } | null): RunEmbedPlacement {
  const rawWidth = attributes?.width;
  const width = typeof rawWidth === "number" ? rawWidth
    : typeof rawWidth === "string" && /^-?\d+(?:\.\d+)?$/.test(rawWidth.trim()) ? Number(rawWidth) : NaN;
  const align = attributes?.align;
  return {
    ...(Number.isFinite(width) ? { width: Math.round(Math.min(maxRunEmbedWidth, Math.max(minRunEmbedWidth, width))) } : {}),
    ...(align === "left" || align === "center" || align === "right" ? { align } : {}),
  };
}

export function runEmbedPlacementAttributes(attributes: LeafDirective["attributes"], placement: RunEmbedPlacement) {
  const { width: _width, align: _align, ...rest } = attributes ?? {};
  const { width, align } = readRunEmbedPlacement(placement);
  return { ...rest, ...(width !== undefined ? { width: String(width) } : {}), ...(align ? { align } : {}) };
}

export function markProductDocRun(node: LeafDirective): boolean {
  if (node.name !== runDirectiveName) return false;
  const snapshot = node.attributes?.snapshot;
  node.data = {
    ...node.data,
    hName: runDirectiveName,
    hProperties: { snapshot: snapshot && runSnapshotPattern.test(snapshot) ? snapshot : "", ...readRunEmbedPlacement(node.attributes) },
    hChildren: [],
  };
  return true;
}
