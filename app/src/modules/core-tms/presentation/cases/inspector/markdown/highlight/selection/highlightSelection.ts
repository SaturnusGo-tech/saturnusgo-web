import type { Nodes, PhrasingContent, Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import { directive } from "micromark-extension-directive";
import { highlightFromMarkdown, highlightToMarkdown } from "../serialization/highlightSerialization";
import { gfm } from "micromark-extension-gfm";
import { gfmFromMarkdown, gfmToMarkdown } from "mdast-util-gfm";
import { highlightedNode, highlightColorOf } from "../model/highlightSyntax";
import type { HighlightColor } from "../model/highlightColors";

type Edit = { start: number; end: number; value: string };
const parse = (value: string) => fromMarkdown(value, {
  extensions: [gfm(), directive()], mdastExtensions: [gfmFromMarkdown(), highlightFromMarkdown()],
});

/** Returns source edits and selection offsets; never rewrites text outside the selected range. */
export function formatHighlightSelection(value: string, start: number, end: number, color: HighlightColor | null) {
  const unchanged = { value, start, end };
  if (start < 0 || end > value.length || start > end) return unchanged;
  const tree = parse(value);
  if (color === null) return removeHighlights(value, tree, start, end);
  if (start === end || insideLiteral(tree, start, end)) return unchanged;
  const selected = value.slice(start, end);
  let offset = start;
  const replacement = selected.split("\n").map((line) => {
    const atLineStart = offset === 0 || value[offset - 1] === "\n";
    offset += line.length + 1;
    if (!line.trim()) return line;
    const prefix = atLineStart ? /^(?: {0,3}(?:#{1,6}\s+|>\s?|(?:[-*+] |\d+[.)] )))+/.exec(line)?.[0] ?? "" : "";
    const content = line.slice(prefix.length);
    const leading = /^\s+/.exec(content)?.[0] ?? "", trailing = /\s+$/.exec(content)?.[0] ?? "";
    const parsed = parse(content.trim()).children;
    const inline = parsed.length === 1 && "children" in parsed[0] ? parsed[0].children as PhrasingContent[] : null;
    if (!inline) return line;
    const marker = toMarkdown(highlightedNode(color, inline), { extensions: [gfmToMarkdown(), highlightToMarkdown()] }).trimEnd();
    return prefix + leading + marker + trailing;
  }).join("\n");
  return { value: value.slice(0, start) + replacement + value.slice(end), start, end: start + replacement.length };
}

function insideLiteral(root: Root, start: number, end: number) {
  let literal = false;
  const visit = (node: Nodes) => {
    const from = node.position?.start.offset ?? -1, to = node.position?.end.offset ?? -1;
    if (["code", "html"].includes(node.type) && from < end && to > start) literal = true;
    if ("children" in node) node.children.forEach(visit);
  };
  visit(root);
  return literal;
}

function removeHighlights(value: string, tree: Root, start: number, end: number) {
  const edits: Edit[] = [];
  const visit = (node: Nodes) => {
    const from = node.position?.start.offset ?? -1, to = node.position?.end.offset ?? -1;
    if (highlightColorOf(node) && from <= end && to >= start) {
      const source = value.slice(from, to);
      const opening = source.indexOf("[") + 1;
      const closing = source.lastIndexOf("]");
      if (opening > 0 && closing >= opening) edits.push({ start: from, end: to, value: source.slice(opening, closing) });
      return;
    }
    if ("children" in node) node.children.forEach(visit);
  };
  visit(tree);
  let next = value, nextStart = start, nextEnd = end;
  for (const edit of edits.reverse()) {
    next = next.slice(0, edit.start) + edit.value + next.slice(edit.end);
    const delta = edit.value.length - (edit.end - edit.start);
    nextStart = nextStart <= edit.start ? nextStart : nextStart >= edit.end ? nextStart + delta : edit.start;
    nextEnd = nextEnd <= edit.start ? nextEnd : nextEnd >= edit.end ? nextEnd + delta : edit.start + edit.value.length;
  }
  return { value: next, start: nextStart, end: nextEnd };
}
