import type { ContainerDirective } from "mdast-util-directive";

export const layoutBlockName = "falcon-columns";
export const layoutColumnName = "falcon-column";
export const productDocColumnCounts = [2, 3, 4, 5] as const;
export type ColumnCount = typeof productDocColumnCounts[number];
export type LayoutRatio = "even" | "left" | "right" | "sidebars";

export function isProductDocColumnCount(count: number): count is ColumnCount {
  return productDocColumnCounts.some((option) => option === count);
}

export function normalizeProductDocLayoutRatio(ratio: unknown, columns: number): LayoutRatio {
  if ((columns === 2 || columns === 3) && (ratio === "left" || ratio === "right")) return ratio;
  if (columns === 3 && ratio === "sidebars") return ratio;
  return "even";
}

export function productDocColumnCount(node: ContainerDirective): ColumnCount | undefined {
  const count = node.children.length;
  if (node.name === layoutBlockName && isProductDocColumnCount(count)
    && node.children.every((column) => column.type === "containerDirective" && column.name === layoutColumnName)) {
    return count;
  }
}

export function productDocLayoutRatio(node: ContainerDirective) {
  return normalizeProductDocLayoutRatio(node.attributes?.ratio, node.children.length);
}
