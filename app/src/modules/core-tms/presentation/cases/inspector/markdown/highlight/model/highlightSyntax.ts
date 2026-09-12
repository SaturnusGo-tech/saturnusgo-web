import type { Nodes, PhrasingContent } from "mdast";
import type { TextDirective } from "mdast-util-directive";
import { directiveToMarkdown } from "mdast-util-directive";
import { toMarkdown } from "mdast-util-to-markdown";
import { isHighlightColor, type HighlightColor } from "./highlightColors";

export function highlightColorOf(node: Nodes): HighlightColor | null {
  if (node.type !== "textDirective" || node.name !== "highlight") return null;
  const entries = Object.entries(node.attributes ?? {});
  if (entries.length !== 1 || entries[0][0] !== "color") return null;
  return isHighlightColor(entries[0][1]) ? entries[0][1] : null;
}

export function highlightedNode(color: HighlightColor, children: PhrasingContent[]): TextDirective {
  return { type: "textDirective", name: "highlight", attributes: { color }, children };
}

export function directiveLiteral(node: Nodes) {
  return toMarkdown(node, { extensions: [directiveToMarkdown()] }).trimEnd();
}
