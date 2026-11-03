import { useRef, type RefObject } from "react";
import { insertEmojiSelection, type EmojiSelection } from "./insertEmojiSelection";

export function useTextareaEmoji(value: string, input: RefObject<HTMLTextAreaElement | null>,
  commit: (value: string, caret: number) => void, onOpen?: () => void) {
  const saved = useRef<EmojiSelection | null>(null), latest = useRef(value);
  latest.current = value;
  return {
    remember() {
      const node = input.current;
      saved.current = node ? {value: latest.current, start: node.selectionStart, end: node.selectionEnd} : null;
      onOpen?.();
    },
    insert(emoji: string) {
      const next = saved.current && insertEmojiSelection(latest.current, saved.current, emoji);
      if (!next || !input.current?.isConnected) return;
      commit(next.value, next.caret);
      requestAnimationFrame(() => { input.current?.focus({preventScroll:true}); input.current?.setSelectionRange(next.caret, next.caret); });
    },
  };
}
