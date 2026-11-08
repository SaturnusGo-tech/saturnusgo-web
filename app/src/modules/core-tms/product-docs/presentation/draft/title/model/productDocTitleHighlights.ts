import type { ProductDocTitleHighlight } from "../../../../domain/product-docs";
import { isHighlightColor, type HighlightColor } from "../../../../../presentation/cases/inspector/markdown/highlight/model/highlightColors";

type Marks = readonly ProductDocTitleHighlight[];
type Color = HighlightColor | null;

function splitsSurrogate(title: string, index: number) {
  const before = title.charCodeAt(index - 1), after = title.charCodeAt(index);
  return before >= 0xd800 && before <= 0xdbff && after >= 0xdc00 && after <= 0xdfff;
}

function toColors(title: string, marks: Marks): Color[] {
  const colors = Array<Color>(title.length).fill(null);
  for (const { start, end, color } of marks) {
    if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start < end && end <= title.length
      && !splitsSurrogate(title, start) && !splitsSurrogate(title, end) && isHighlightColor(color)) {
      colors.fill(color, start, end);
    }
  }
  return colors;
}

function fromColors(colors: readonly Color[]): ProductDocTitleHighlight[] {
  const highlights: ProductDocTitleHighlight[] = [];
  for (const [index, color] of colors.entries()) {
    if (!color) continue;
    const previous = highlights[highlights.length - 1];
    if (previous?.color === color && previous.end === index) previous.end++;
    else highlights.push({ start: index, end: index + 1, color });
  }
  return highlights;
}

export function markTitleRange(title: string, marks: Marks, start: number, end: number, color: Color) {
  if (splitsSurrogate(title, start)) start--;
  if (splitsSurrogate(title, end)) end++;
  return fromColors(toColors(title, marks).fill(color, start, end));
}

export function changeTitleHighlights(previous: string, next: string, marks: Marks): ProductDocTitleHighlight[] {
  if (!marks.length) return [];
  if (previous === next) return fromColors(toColors(previous, marks));
  let start = 0;
  while (start < previous.length && start < next.length && previous[start] === next[start]) start++;
  if (splitsSurrogate(previous, start) || splitsSurrogate(next, start)) start--;
  let oldEnd = previous.length, newEnd = next.length;
  while (oldEnd > start && newEnd > start && previous[oldEnd - 1] === next[newEnd - 1]) { oldEnd--; newEnd--; }
  if (splitsSurrogate(previous, oldEnd) || splitsSurrogate(next, newEnd)) { oldEnd++; newEnd++; }
  const colors = toColors(previous, marks);
  const inside = colors[start];
  const insertedColor = inside && (oldEnd === start
    ? colors[start - 1] === inside
    : colors.slice(start, oldEnd).every((color) => color === inside)) ? inside : null;
  return fromColors([...colors.slice(0, start), ...Array<Color>(newEnd - start).fill(insertedColor), ...colors.slice(oldEnd)]);
}

export function trimTitleHighlights(title: string, marks: Marks): ProductDocTitleHighlight[] {
  return fromColors(toColors(title, marks).slice(title.length - title.trimStart().length, title.trimEnd().length));
}

export function titleRuns(title: string, marks: Marks = []) {
  const runs: { text: string; color: Color; offset: number }[] = [];
  let offset = 0;
  const colors = toColors(title, marks);
  for (const text of title) {
    const color = colors[offset];
    const previous = runs[runs.length - 1];
    if (previous?.color === color) previous.text += text;
    else runs.push({ text, color, offset });
    offset += text.length;
  }
  return runs;
}
