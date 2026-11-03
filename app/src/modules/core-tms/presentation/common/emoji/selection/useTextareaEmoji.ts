import { useLayoutEffect, useRef, type RefObject } from "react";
import { insertEmojiSelection, type EmojiSelection } from "./insertEmojiSelection";

export function useTextareaEmoji(value: string, input: RefObject<HTMLTextAreaElement | null>,
  commit: (value: string, caret: number) => void, onOpen?: () => void) {
  const saved = useRef<EmojiSelection | null>(null), latest = useRef(value);
  const pending = useRef<{ node: HTMLTextAreaElement; source: string; value: string; caret: number } | null>(null);
  latest.current = value;
  useLayoutEffect(() => {
    const next = pending.current, node = input.current;
    if (!next) return;
    if (node !== next.node || !node?.isConnected || node.readOnly || node.disabled) { pending.current = null; return; }
    if (value !== next.value) { if (value !== next.source) pending.current = null; return; }
    pending.current = null;
    node.focus({ preventScroll: true }); node.setSelectionRange(next.caret, next.caret);
  }, [value, input]);
  return {
    remember() {
      const node = input.current;
      saved.current = node ? {value: latest.current, start: node.selectionStart, end: node.selectionEnd} : null;
      onOpen?.();
    },
    insert(emoji: string) {
      const next = saved.current && insertEmojiSelection(latest.current, saved.current, emoji);
      const node = input.current;
      if (!next || !node?.isConnected || node.readOnly || node.disabled) return;
      pending.current = { node, source: latest.current, ...next };
      commit(next.value, next.caret);
    },
  };
}
