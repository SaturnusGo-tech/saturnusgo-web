import type { ClipboardEvent } from "react";
import { clipboardMarkdown } from "./clipboardMarkdown";

export function isCodeInsertion(value: string, position: number) {
  const prefix = value.slice(0, position);
  let fence = "";
  for (const line of prefix.split("\n")) {
    const match = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (!match) continue;
    if (!fence) fence = match[1];
    else if (match[1][0] === fence[0] && match[1].length >= fence.length && !match[2].trim()) fence = "";
  }
  if (fence) return true;
  // An unmatched inline delimiter means pasted code must stay literal.
  let inline = "";
  for (const match of prefix.slice(prefix.lastIndexOf("\n") + 1).matchAll(/(?<!\\)`+/g)) {
    if (!inline) inline = match[0];
    else if (match[0] === inline) inline = "";
  }
  return Boolean(inline);
}

export function pasteMarkdown(event: ClipboardEvent<HTMLTextAreaElement>, onChange: (value: string) => void) {
  if (event.defaultPrevented || event.clipboardData.files.length) return;
  const input = event.currentTarget;
  if (isCodeInsertion(input.value, input.selectionStart)) return;
  const text = clipboardMarkdown(event.clipboardData.getData("text/html"), event.clipboardData.getData("text/plain"));
  if (text === null) return;
  event.preventDefault();
  const before = input.value.slice(0, input.selectionStart), after = input.value.slice(input.selectionEnd);
  const block = /\n|^#{1,6} |^[-*] |^\d+\. /.test(text);
  const leading = block && before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
  const trailing = block && after && !after.startsWith("\n\n") ? (after.startsWith("\n") ? "\n" : "\n\n") : "";
  const insertion = leading + text + trailing;
  const cursor = before.length + insertion.length;
  onChange(before + insertion + after);
  requestAnimationFrame(() => input.setSelectionRange(cursor, cursor));
}
