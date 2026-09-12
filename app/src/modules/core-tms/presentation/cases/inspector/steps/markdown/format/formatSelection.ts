import { formatStepHeading } from "./formatHeading";

export type StepFormat = "bold" | "inline" | "code" | "list" | "h1" | "h2" | "h3";

export function formatStepSelection(value: string, start: number, end: number, format: StepFormat) {
  if (format === "h1" || format === "h2" || format === "h3") return formatStepHeading(value, start, end, Number(format[1]));
  const selected = value.slice(start, end);
  let before = "", after = "", content = selected;
  if (format === "bold") { before = "**"; after = "**"; }
  if (format === "inline") {
    const runs = selected.match(/`+/g) ?? [];
    const fence = "`".repeat(Math.max(0, ...runs.map((run) => run.length)) + 1);
    const pad = selected.startsWith("`") || selected.endsWith("`") ? " " : "";
    before = fence + pad; after = pad + fence;
  }
  if (format === "code") {
    const runs = selected.match(/`+/g) ?? [];
    const fence = "`".repeat(Math.max(2, ...runs.map((run) => run.length)) + 1);
    before = (start > 0 && value[start - 1] !== "\n" ? "\n" : "") + fence + "\n";
    after = "\n" + fence + (end < value.length && value[end] !== "\n" ? "\n" : "");
  }
  if (format === "list") {
    before = (start > 0 && value[start - 1] !== "\n" ? "\n" : "") + "- ";
    content = selected.replace(/\n/g, "\n- ");
  }
  return { value: value.slice(0, start) + before + content + after + value.slice(end),
    start: start + before.length, end: start + before.length + content.length };
}
