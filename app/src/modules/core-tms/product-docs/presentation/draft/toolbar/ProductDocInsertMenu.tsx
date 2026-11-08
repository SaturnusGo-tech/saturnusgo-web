"use client";

import {
  activeEditor$, currentSelection$, editorInTable$, insertCodeBlock$, insertDirective$,
  insertTable$, insertThematicBreak$, openNewImageDialog$, readOnly$, useCellValue, usePublisher,
} from "@mdxeditor/editor";
import { $getNodeByKey, $getRoot, $getSelection, $isRangeSelection, $setSelection, type RangeSelection } from "lexical";
import { CircleAlert, Code2, FileUp, Image, Info, Lightbulb, Minus, Plus, Search, Table2, TriangleAlert } from "lucide-react";
import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { useAnchoredPopup } from "../../../../presentation/common/popup/useAnchoredPopup";
import styles from "./insert-menu.module.css";

export function ProductDocInsertMenu({ locale, onImport }: { locale: TmsLocale; onImport(): void }) {
  const ru = locale === "ru";
  const editor = useCellValue(activeEditor$);
  const currentSelection = useCellValue(currentSelection$);
  const readOnly = useCellValue(readOnly$);
  const inTable = useCellValue(editorInTable$);
  const code = usePublisher(insertCodeBlock$);
  const divider = usePublisher(insertThematicBreak$);
  const image = usePublisher(openNewImageDialog$);
  const table = usePublisher(insertTable$);
  const note = usePublisher(insertDirective$);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const selectedOption = useRef<HTMLButtonElement>(null);
  const saved = useRef<RangeSelection | null>(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const close = useCallback(() => setOpen(false), []);

  useAnchoredPopup(open, false, root, trigger, menu, close, 248, 360);
  useLayoutEffect(() => { if (open) search.current?.focus({ preventScroll: true }); }, [open]);
  const commands = [
    { key: "image", label: ru ? "Изображение" : "Image", Icon: Image, run: () => image() },
    { key: "table", label: ru ? "Таблица" : "Table", Icon: Table2, run: () => table({ rows: 3, columns: 3 }) },
    { key: "code", label: ru ? "Блок кода" : "Code block", Icon: Code2, run: () => code({}) },
    { key: "divider", label: ru ? "Разделитель" : "Divider", Icon: Minus, run: () => divider() },
    { key: "note", label: ru ? "Примечание" : "Note", Icon: Info, run: () => note({ type: "containerDirective", name: "note" }) },
    { key: "tip", label: ru ? "Совет" : "Tip", Icon: Lightbulb, run: () => note({ type: "containerDirective", name: "tip" }) },
    { key: "info", label: ru ? "Информация" : "Information", Icon: Info, run: () => note({ type: "containerDirective", name: "info" }) },
    { key: "caution", label: ru ? "Предупреждение" : "Caution", Icon: TriangleAlert, run: () => note({ type: "containerDirective", name: "caution" }) },
    { key: "danger", label: ru ? "Важное" : "Important", Icon: CircleAlert, run: () => note({ type: "containerDirective", name: "danger" }) },
    { key: "file", label: ru ? "Текст из файла…" : "Text from file…", Icon: FileUp, run: onImport },
  ].filter(({ key, label }) => (!inTable || key === "image" || key === "file")
    && (label.toLowerCase().includes(query.trim().toLowerCase()) || key.includes(query.trim().toLowerCase())));
  const active = commands[index];
  function moveSelection(direction: number) {
    setIndex((i) => (i + commands.length + direction) % commands.length);
    requestAnimationFrame(() => selectedOption.current?.scrollIntoView({ block: "nearest" }));
  }

  function toggle() {
    if (open) { close(); return; }
    saved.current = editor?.getEditorState().read(() => {
      const selection = $getSelection();
      return $isRangeSelection(selection) ? selection.clone() : currentSelection?.clone() ?? null;
    }) ?? null;
    setQuery("");
    setIndex(0);
    setOpen(true);
  }

  function execute(command: typeof commands[number]) {
    close();
    const selection = saved.current;
    saved.current = null;
    if (editor && command.key !== "file") {
      editor.update(() => {
        if (selection && $getNodeByKey(selection.anchor.key) && $getNodeByKey(selection.focus.key)) {
          $setSelection(selection.clone());
        } else if (!$isRangeSelection($getSelection())) {
          $getRoot().selectEnd();
        }
      }, { discrete: true });
    }
    command.run();
  }

  const label = ru ? "Вставить" : "Insert";
  return <div className={styles.root} ref={root} onKeyDown={(event) => {
    if (event.key !== "Escape" || !open) return;
    event.stopPropagation();
    close();
    trigger.current?.focus({ preventScroll: true });
  }}>
    <button type="button" ref={trigger} aria-label={label} title={label} aria-expanded={open}
      aria-haspopup="dialog" aria-controls={open ? id : undefined} disabled={readOnly}
      className={styles.trigger} onMouseDown={(event) => event.preventDefault()} onClick={toggle}>
      <Plus size={17} aria-hidden="true" />
    </button>
    {open && <div ref={menu} id={id} role="dialog" aria-label={label} popover="manual" className={styles.panel}
      onBlur={(event) => { if (event.relatedTarget && !root.current?.contains(event.relatedTarget)) close(); }}>
      <label className={styles.search}>
        <Search size={15} aria-hidden="true" />
        <input ref={search} value={query} role="combobox" aria-expanded="true" aria-controls={id + "-results"}
          aria-activedescendant={active ? id + "-" + active.key : undefined}
          aria-label={ru ? "Найти элемент" : "Find an element"}
          placeholder={ru ? "Найти элемент…" : "Find an element…"}
          onChange={(event) => { setQuery(event.target.value); setIndex(0); }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && active) {
              event.preventDefault();
              execute(active);
            }
            if ((event.key === "ArrowDown" || event.key === "ArrowUp") && commands.length) {
              event.preventDefault();
              moveSelection(event.key === "ArrowDown" ? 1 : -1);
            }
          }} />
      </label>
      <div role="listbox" id={id + "-results"} aria-label={label} className={styles.items}>
        {commands.map((command, i) => <button type="button" key={command.key} id={id + "-" + command.key}
          role="option" ref={index === i ? selectedOption : undefined} tabIndex={-1} aria-selected={index === i}
          onMouseDown={(event) => event.preventDefault()} onPointerEnter={() => setIndex(i)}
          onClick={() => execute(command)}>
          <command.Icon size={16} aria-hidden="true" />
          <span>{command.label}</span>
        </button>)}
        {commands.length === 0 && <p role="status">{ru ? "Элементы не найдены" : "No matching elements"}</p>}
      </div>
    </div>}
  </div>;
}
