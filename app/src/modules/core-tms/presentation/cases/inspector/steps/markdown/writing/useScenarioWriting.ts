import { useRef, type RefObject } from "react";
import { replaceWritingSelection, type WritingTarget } from "../../../../../../writing-assistant/model/target";

export function useScenarioWriting(value: string, input: RefObject<HTMLTextAreaElement | null>,
  history: { boundary: () => void; record: (next: string) => void }, onPreview: () => void) {
  const current = useRef(value); current.current = value;
  return (): WritingTarget | null => {
    const node = input.current;
    if (!node) return null;
    const source = current.current;
    const selected = node.selectionStart !== node.selectionEnd;
    const start = selected ? node.selectionStart : 0;
    const end = selected ? node.selectionEnd : source.length;
    history.boundary();
    return { text: source.slice(start, end), selected,
      restore: () => requestAnimationFrame(() => { if (node.isConnected) { node.focus({ preventScroll: true }); node.setSelectionRange(start, end); } }),
      apply: (markdown) => {
        if (!node.isConnected) return false;
        const next = replaceWritingSelection(source, current.current, start, end, markdown);
        if (next === null) return false;
        history.boundary(); history.record(next);
        onPreview();
        return true;
      },
    };
  };
}
