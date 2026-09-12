import { fromMarkdown } from "mdast-util-from-markdown";
import type { Nodes } from "mdast";

type Edit = { at: number; remove: number; insert: string };

/** Format whole selected lines while retaining source offsets, list prefixes and code verbatim. */
export function formatStepHeading(value: string, start: number, end: number, level: number) {
  start = Math.max(0, Math.min(value.length, start));
  end = Math.max(start, Math.min(value.length, end));
  if (!Number.isInteger(level) || level < 1 || level > 6) return { value, start, end };
  const first = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
  const lastPoint = end > start && value[end - 1] === "\n" ? end - 1 : end;
  const nextNewline = value.indexOf("\n", lastPoint);
  const last = nextNewline < 0 ? value.length : nextNewline;
  const codeLines = protectedCodeLines(value);
  const lines: { at: number; old: string }[] = [];
  let position = 0;
  value.split("\n").forEach((raw, index) => {
    const at = position; position += raw.length + 1;
    if (at < first || at > last || codeLines.has(index)) return;
    const line = raw.replace(/\r$/, "");
    const match = line.match(/^([ \t]*(?:>[ \t]*)*(?:(?:[-+*]|\d+[.)])[ \t]+)?)(.*)$/);
    if (!match || (!match[2].trim() && start !== end)) return;
    const marker = match[2].match(/^#{1,6}(?:[ \t]+|$)/)?.[0] ?? "";
    lines.push({ at: at + match[1].length, old: marker });
  });
  // Mixed selections become one consistent level; a uniform selection toggles back to paragraphs.
  const toggle = lines.length > 0 && lines.every((line) => line.old.trim() === "#".repeat(level));
  const edits: Edit[] = lines.map((line) => ({ at: line.at, remove: line.old.length,
    insert: toggle ? "" : "#".repeat(level) + " " }));
  let result = value;
  for (const edit of [...edits].reverse()) result = result.slice(0, edit.at) + edit.insert + result.slice(edit.at + edit.remove);
  return { value: result, start: mapOffset(start, edits), end: mapOffset(end, edits) };
}

function mapOffset(offset: number, edits: Edit[]) {
  let delta = 0;
  for (const edit of edits) {
    if (offset < edit.at) break;
    if (offset <= edit.at + edit.remove) return edit.at + delta + edit.insert.length;
    delta += edit.insert.length - edit.remove;
  }
  return offset + delta;
}

function protectedCodeLines(value: string) {
  const lines = new Set<number>();
  function visit(node: Nodes) {
    if (node.type === "code" && node.position) {
      for (let line = node.position.start.line - 1; line < node.position.end.line; line++) lines.add(line);
    } else if ("children" in node) node.children.forEach(visit);
  }
  visit(fromMarkdown(value));
  return lines;
}
