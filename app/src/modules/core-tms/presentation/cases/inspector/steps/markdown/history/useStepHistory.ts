import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";

type Entry = { value: string; start: number; end: number };

/** A rich paste is one undo transaction in both Chromium and WebKit. */
export function useStepHistory(value: string, onChange: (value: string) => void, input: RefObject<HTMLTextAreaElement | null>) {
  const state = useRef({ entries: [{ value, start: 0, end: 0 }] as Entry[], index: 0, typedAt: 0 });
  const change = useRef(onChange);
  change.current = onChange;
  if (state.current.entries[state.current.index].value !== value) {
    state.current = { entries: [{ value, start: 0, end: 0 }], index: 0, typedAt: 0 };
  }
  function record(next: string, typing = false) {
    const history = state.current, node = input.current;
    if (next === history.entries[history.index].value) return;
    const now = Date.now();
    const entry = { value: next, start: node?.selectionStart ?? next.length, end: node?.selectionEnd ?? next.length };
    const coalesce = typing && history.typedAt && now - history.typedAt < 800 && history.index > 0;
    history.entries = history.entries.slice(0, history.index + 1);
    if (coalesce) history.entries[history.index] = entry;
    else { history.entries.push(entry); history.index++; }
    if (history.entries.length > 100) { history.entries.shift(); history.index--; }
    history.typedAt = typing ? now : 0;
    change.current(next);
  }
  function boundary() {
    const history = state.current, node = input.current;
    history.typedAt = 0;
    if (node) Object.assign(history.entries[history.index], { start: node.selectionStart, end: node.selectionEnd });
  }
  function restore(redo: boolean) {
    const history = state.current;
    const index = history.index + (redo ? 1 : -1);
    if (index < 0 || index >= history.entries.length) return;
    history.index = index; history.typedAt = 0;
    const entry = history.entries[index];
    change.current(entry.value);
    requestAnimationFrame(() => input.current?.setSelectionRange(entry.start, entry.end));
  }
  useEffect(() => {
    const node = input.current;
    const beforeInput = (event: InputEvent) => {
      if (event.inputType === "historyUndo" || event.inputType === "historyRedo") {
        event.preventDefault(); restore(event.inputType === "historyRedo");
      }
    };
    node?.addEventListener("beforeinput", beforeInput);
    return () => node?.removeEventListener("beforeinput", beforeInput);
  }, [input]);
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.nativeEvent.isComposing || !(event.metaKey || event.ctrlKey) || event.altKey) return false;
    const key = event.key.toLowerCase();
    if (key !== "z" && key !== "y") return false;
    event.preventDefault(); event.stopPropagation();
    restore(key === "y" || event.shiftKey);
    return true;
  }
  return { record, boundary, onKeyDown };
}
