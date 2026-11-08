import type { ContainerDirective } from "mdast-util-directive";

export const productDocCollapseName = "falcon-collapse";
export const maximumDiagramSource = 16_000;
export const maximumDiagramPrompt = 2_000;
export const maximumFormulaSource = 4_000;

const diagramHeader = /^(?:flowchart|graph|sequenceDiagram|classDiagram(?:-v2)?|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|quadrantChart|requirementDiagram|C4\w+|sankey(?:-beta)?|xychart(?:-beta)?|block(?:-beta)?|architecture(?:-beta)?|kanban|packet(?:-beta)?|radar(?:-beta)?|treemap(?:-beta)?|venn(?:-beta)?|ishikawa|zenuml)(?:\s|;|$)/i;

export function isDiagramSource(value: string) {
  const body = value.replace(/^\s*(?:%%[^\r\n]*(?:\r?\n|$)\s*)*/u, "");
  return diagramHeader.test(body);
}

export function canRenderDiagram(value: string) {
  // Document authors can specify a graph, while application settings stay under Falcon control.
  const containsConfig = /^\s*---(?:\r?\n|$)|%%\s*\{/m.test(value);
  // Mermaid can create temporary SVG nodes before returning its result. Reject remote
  // resources and navigation before the renderer receives any author-controlled text.
  const containsResource = /(?:\b(?:https?|file|data|blob):|\/\/|\burl\s*\(|\b(?:img|image|href|src|xlink:href)\s*[:=]|<\/?(?:img|image|script|foreignObject)\b|(?:^|;)\s*(?:click|style|classDef|linkStyle|link|links)\b)/im.test(value);
  return value.length <= maximumDiagramSource && isDiagramSource(value) && !containsConfig && !containsResource;
}

export function structuredBlockKind(language: string | null | undefined): "diagram" | "math" | undefined {
  if (language?.toLowerCase() === "mermaid") return "diagram";
  if (["latex", "tex", "math"].includes(language?.toLowerCase() ?? "")) return "math";
}

export function markProductDocCollapse(node: ContainerDirective) {
  if (node.name !== productDocCollapseName) return false;
  node.data = {
    ...node.data,
    hName: productDocCollapseName,
    hProperties: { heading: node.attributes?.title ?? "" },
  };
  return true;
}
