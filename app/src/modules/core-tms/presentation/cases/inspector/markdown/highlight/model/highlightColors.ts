export const highlightColors = ["yellow", "blue", "green", "pink", "purple"] as const;
export type HighlightColor = typeof highlightColors[number];
export const highlightStyleProperty = "--falcon-marker";

export function isHighlightColor(value: unknown): value is HighlightColor {
  return typeof value === "string" && highlightColors.some((color) => color === value);
}

export function highlightFromStyle(style: string): HighlightColor | null {
  const value = /(?:^|;)\s*--falcon-marker\s*:\s*([a-z]+)\s*(?:;|$)/.exec(style)?.[1];
  return isHighlightColor(value) ? value : null;
}

export function highlightStyle(color: HighlightColor) {
  return `${highlightStyleProperty}: ${color};`;
}
