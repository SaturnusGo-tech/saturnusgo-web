"use client";

import {
  Button, ButtonWithTooltip, editorInTable$, insertTable$, readOnly$, useCellValue, usePublisher,
} from "@mdxeditor/editor";
import { ChevronDown, Table2 } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import styles from "./tables.module.css";

const defaultSize = { rows: 3, columns: 3 };
const maxRows = 5;
const maxColumns = 10;
type TableSize = typeof defaultSize;

export function ProductDocTableTools({ locale }: { locale: TmsLocale }) {
  const insertTable = usePublisher(insertTable$);
  const insideTable = useCellValue(editorInTable$);
  const readOnly = useCellValue(readOnly$);
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(defaultSize);
  const group = useRef<HTMLDivElement>(null);
  const sizeTrigger = useRef<HTMLButtonElement>(null);
  const pickerId = useId();
  const ru = locale === "ru";
  const disabled = readOnly || insideTable;

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && !group.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("focusin", dismiss);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("focusin", dismiss);
    };
  }, [open]);

  function focusSize({ rows, columns }: TableSize) {
    group.current?.querySelector<HTMLButtonElement>(`[data-size="${columns}x${rows}"]`)?.focus({ preventScroll: true });
  }

  useLayoutEffect(() => {
    if (open) focusSize(defaultSize);
  }, [open]);

  function insert(size: TableSize) {
    setOpen(false);
    insertTable(size);
  }

  function navigate(event: KeyboardEvent, rows: number, columns: number) {
    if (event.key === "ArrowUp") rows -= 1;
    else if (event.key === "ArrowDown") rows += 1;
    else if (event.key === "ArrowLeft") columns -= 1;
    else if (event.key === "ArrowRight") columns += 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      sizeTrigger.current?.focus();
      return;
    } else return;

    event.preventDefault();
    focusSize({ rows: Math.max(1, Math.min(maxRows, rows)), columns: Math.max(1, Math.min(maxColumns, columns)) });
  }

  return <div ref={group} className={styles.tableInsert} data-toolbar-item>
    <ButtonWithTooltip title={ru ? "Вставить таблицу" : "Insert table"} disabled={disabled}
      onMouseDown={(event) => event.preventDefault()} onClick={() => insert(defaultSize)}>
      <Table2 size={16} />
    </ButtonWithTooltip>
    <Button className={styles.sizeTrigger} ref={sizeTrigger} title={ru ? "Размер таблицы" : "Table size"}
      aria-label={ru ? "Размер таблицы" : "Table size"} aria-expanded={open} aria-controls={open ? pickerId : undefined}
      aria-haspopup="dialog" disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => { setSize(defaultSize); setOpen(!open); }}>
      <ChevronDown size={12} />
    </Button>
    {open && !disabled ? <div className={styles.sizePicker} role="dialog" id={pickerId}
      data-editor-dialog aria-label={ru ? "Выберите размер таблицы" : "Choose table size"}>
      <div className={styles.sizeGrid}>
        {Array.from({ length: maxRows * maxColumns }, (_, index) => {
          const rows = Math.floor(index / maxColumns) + 1;
          const columns = index % maxColumns + 1;
          const current = size.rows === rows && size.columns === columns;
          return <button key={index} type="button" className={styles.sizeCell} data-size={`${columns}x${rows}`}
            data-highlighted={rows <= size.rows && columns <= size.columns} tabIndex={current ? 0 : -1}
            aria-label={ru ? `${columns} × ${rows}, колонки × строки` : `${columns} × ${rows}, columns × rows`}
            onFocus={() => setSize({ rows, columns })}
            onPointerEnter={() => setSize({ rows, columns })}
            onMouseDown={(event) => event.preventDefault()} onKeyDown={(event) => navigate(event, rows, columns)}
            onClick={() => insert({ rows, columns })} />;
        })}
      </div>
      <div className={styles.sizeValue}>{size.columns} × {size.rows}</div>
    </div> : null}
  </div>;
}
