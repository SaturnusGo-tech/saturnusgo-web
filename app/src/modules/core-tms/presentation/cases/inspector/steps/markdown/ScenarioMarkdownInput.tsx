"use client";

import { Bold, Code, FileCode2, List, Pencil, Check } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ClipboardEventHandler } from "react";
import { ScenarioMarkdown } from "./ScenarioMarkdown";
import { formatStepSelection, type StepFormat } from "./format/formatSelection";
import { pasteMarkdown } from "./paste/pasteMarkdown";
import { useStepHistory } from "./history/useStepHistory";
import css from "./scenarioMarkdown.module.css";
import { WritingAction } from "../../../../../writing-assistant/presentation/WritingAction";
import { useScenarioWriting } from "./writing/useScenarioWriting";
import { RawHighlightToolbar } from "../../markdown/highlight/raw/RawHighlightToolbar";
import { formatHighlightSelection } from "../../markdown/highlight/selection/highlightSelection";
import type { HighlightColor } from "../../markdown/highlight/model/highlightColors";

type Props = {
  id?: string; value: string; label: string; placeholder: string; ru: boolean;
  autoFocus?: boolean; onChange: (value: string) => void;
  onPaste?: ClipboardEventHandler<HTMLTextAreaElement>;
};

export function ScenarioMarkdownInput(props: Props) {
  const [editing, setEditing] = useState(Boolean(props.autoFocus));
  const [writing, setWriting] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const history = useStepHistory(props.value, props.onChange, input);
  const shell = useRef<HTMLDivElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const markerSelection = useRef({ value: "", start: 0, end: 0 });
  const sourceVisible = editing || !props.value;
  const captureWriting = useScenarioWriting(props.value, input, history, preview);
  useLayoutEffect(() => {
    const node = input.current;
    if (!node || !sourceVisible) return;
    const resize = () => { node.style.height = "0px"; node.style.height = `${Math.min(240, node.scrollHeight)}px`; };
    resize();
    const observer = new ResizeObserver(resize);
    if (shell.current) observer.observe(shell.current);
    return () => observer.disconnect();
  }, [props.value, sourceVisible]);

  function edit() {
    setEditing(true);
    requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
  }
  function preview() {
    setEditing(false);
    requestAnimationFrame(() => editButton.current?.focus({ preventScroll: true }));
  }
  function format(kind: StepFormat) {
    const node = input.current;
    if (!node) return;
    const next = formatStepSelection(props.value, node.selectionStart, node.selectionEnd, kind);
    history.boundary();
    history.record(next.value);
    requestAnimationFrame(() => { node.focus({ preventScroll: true }); node.setSelectionRange(next.start, next.end); });
  }
  function mark(color: HighlightColor | null) {
    const selected = markerSelection.current;
    if (selected.value !== props.value || !input.current) return;
    const next = formatHighlightSelection(props.value, selected.start, selected.end, color);
    history.boundary(); history.record(next.value);
    requestAnimationFrame(() => { input.current?.focus({ preventScroll: true }); input.current?.setSelectionRange(next.start, next.end); });
  }
  const actions = [
    { kind: "bold", Icon: Bold, label: props.ru ? "Жирный текст" : "Bold" },
    { kind: "inline", Icon: Code, label: props.ru ? "Код в строке" : "Inline code" },
    { kind: "code", Icon: FileCode2, label: props.ru ? "Блок кода" : "Code block" },
    { kind: "list", Icon: List, label: props.ru ? "Список" : "List" },
  ] as const;
  return <div ref={shell} className={css.input} data-editing={editing} onBlur={(event) => {
    if (!writing && !event.currentTarget.contains(event.relatedTarget as Node | null)) setEditing(false);
  }}>
    <div className={css.toolbarReveal}><div><div className={css.toolbar} role="group" aria-label={props.ru ? "Форматирование шага" : "Step formatting"}>
      <WritingAction ru={props.ru} capture={captureWriting} tabIndex={editing ? 0 : -1} onOpenChange={setWriting} />
      <RawHighlightToolbar locale={props.ru ? "ru" : "en"} tabIndex={editing ? 0 : -1} onChoose={mark}
        onOpen={() => { markerSelection.current = { value: props.value, start: input.current?.selectionStart ?? 0, end: input.current?.selectionEnd ?? 0 }; }} />
      {actions.map(({ kind, Icon, label }) => <button key={kind} type="button" title={label} aria-label={label}
        tabIndex={editing ? 0 : -1} onMouseDown={(event) => event.preventDefault()} onClick={() => format(kind)}><Icon size={14} /></button>)}
      <button type="button" className={css.done} tabIndex={editing ? 0 : -1} title={props.ru ? "Готово" : "Done"}
        aria-label={props.ru ? "Показать форматирование" : "Show formatted text"}
        onClick={preview}><Check size={14} /></button>
    </div></div></div>
    <textarea ref={input} id={props.id} rows={1} hidden={!sourceVisible} data-code={/```|~~~/.test(props.value)} value={props.value}
      aria-label={props.label} placeholder={props.placeholder} autoFocus={props.autoFocus}
      onFocus={() => setEditing(true)} onChange={(event) => history.record(event.target.value, (event.nativeEvent as InputEvent).inputType === "insertText")}
      onPaste={(event) => { props.onPaste?.(event); history.boundary(); pasteMarkdown(event, history.record); }}
      onKeyDown={(event) => {
        if (history.onKeyDown(event)) return;
        if (event.nativeEvent.isComposing) return;
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") { event.preventDefault(); format("bold"); }
        if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); preview(); }
      }} />
    {!sourceVisible && <div className={css.preview} onClick={(event) => {
      if (!(event.target as Element).closest("a, button") && !window.getSelection()?.toString()) edit();
    }}>
      <ScenarioMarkdown value={props.value} label={props.label} />
      <button ref={editButton} id={props.id ? `${props.id}-edit` : undefined} type="button" className={css.edit}
        aria-label={`${props.ru ? "Изменить" : "Edit"}: ${props.label}`} onClick={edit}><Pencil size={13} /></button>
    </div>}
  </div>;
}
