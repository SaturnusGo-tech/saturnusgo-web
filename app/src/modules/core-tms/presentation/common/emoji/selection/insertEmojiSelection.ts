export type EmojiSelection = { value: string; start: number; end: number };

export function insertEmojiSelection(value: string, selection: EmojiSelection, emoji: string) {
  if (value !== selection.value || !emoji || selection.start < 0 || selection.end < selection.start
    || selection.end > value.length) return null;
  return { value: value.slice(0, selection.start) + emoji + value.slice(selection.end), caret: selection.start + emoji.length };
}
