import { useId, useState, type KeyboardEvent, type RefObject } from "react";
import { useCaseData } from "../../application/editor/CaseDataContext";
import { findVariableCompletion, insertVariableCompletion } from "../../application/variables/variable-completion";
import css from "../shared/data.module.css";
export function useVariableSuggestions(value: string, input: RefObject<HTMLTextAreaElement | null>, enabled: boolean, onChange: (value: string) => void, ru: boolean) {
  const data = useCaseData(), id = useId();
  const [caret, setCaret] = useState<number | null>(null), [selected, setSelected] = useState(0);
  const completion = enabled && caret !== null ? findVariableCompletion(value, caret) : null;
  const choices = completion ? (data?.validation?.variables ?? []).filter(item => item.token.toLowerCase().includes(completion.query.toLowerCase())).slice(0, 8) : [];
  const active = Math.min(selected, Math.max(0, choices.length - 1));
  function insert(index: number) {
    if (!completion || !choices[index]) return;
    const next = insertVariableCompletion(value, completion, choices[index].token);
    onChange(next.value); setCaret(null);
    requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(next.caret, next.caret); });
  }
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!choices.length) return false;
    if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) {
      event.preventDefault(); event.stopPropagation();
      if (event.key === "Escape") setCaret(null);
      else if (event.key === "Enter") insert(active);
      else setSelected(current => (current + (event.key === "ArrowDown" ? 1 : -1) + choices.length) % choices.length);
      return true;
    }
    return false;
  }
  return {
    refresh: () => { setCaret(input.current?.selectionStart ?? null); setSelected(0); },
    close: () => setCaret(null), onKeyDown,
    attributes: { "aria-autocomplete": "list" as const, "aria-controls": choices.length ? id : undefined, "aria-activedescendant": choices.length ? `${id}-${active}` : undefined },
    menu: choices.length > 0 && <div className={css.suggestions} id={id} role="listbox" aria-label={ru ? "Переменные тестовых данных" : "Test data variables"}>
      {choices.map((item, index) => <button id={`${id}-${index}`} key={item.token} type="button" role="option" aria-selected={index === active}
        onMouseDown={event => event.preventDefault()} onClick={() => insert(index)}><span>{`{{${item.token}}}`}</span><small>{item.type} · {item.secret ? (ru ? "Защищено" : "Protected") : item.source}</small></button>)}
    </div>,
  };
}
