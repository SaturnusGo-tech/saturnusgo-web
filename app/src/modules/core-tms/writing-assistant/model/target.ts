export type WritingTarget = {
  text: string;
  selected: boolean;
  apply: (markdown: string) => boolean;
  restore: () => void;
};
export type WritingActionKind = "improve" | "correct" | "custom";

/** Offsets belong to the captured value, never to a later edited value. */
export function replaceWritingSelection(source: string, current: string, start: number, end: number, replacement: string) {
  if (source !== current || start < 0 || end < start || end > source.length) return null;
  return source.slice(0, start) + replacement + source.slice(end);
}
