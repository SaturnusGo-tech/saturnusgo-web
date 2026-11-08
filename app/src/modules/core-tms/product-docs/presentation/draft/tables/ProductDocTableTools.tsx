"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { useReducedMotion } from "framer-motion";
import {
  editorInTable$, insertTable$, readOnly$, useCellValue, usePublisher,
} from "@mdxeditor/editor";
import { ChevronDown, Table2 } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { ProductDocToolbarButton, toolbarMenuMotion } from "../toolbar/menu/ProductDocToolbarMenu";
import { useProductDocToolbarSelection } from "../toolbar/menu/useProductDocToolbarSelection";
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
  const grid = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const selection = useProductDocToolbarSelection();
  const ru = locale === "ru";
  const disabled = readOnly || insideTable;

  function focusSize({ rows, columns }: TableSize) {
    grid.current?.querySelector<HTMLButtonElement>(`[data-size="${columns}x${rows}"]`)?.focus({ preventScroll: true });
  }

  function insert(size: TableSize) {
    setOpen(false);
    selection.restore();
    insertTable(size);
    selection.focusEditor();
  }

  function navigate(event: KeyboardEvent, rows: number, columns: number) {
    if (event.key === "ArrowUp") rows -= 1;
    else if (event.key === "ArrowDown") rows += 1;
    else if (event.key === "ArrowLeft") columns -= 1;
    else if (event.key === "ArrowRight") columns += 1;
    else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      insert({ rows, columns });
      return;
    } else return;

    event.preventDefault();
    focusSize({ rows: Math.max(1, Math.min(maxRows, rows)), columns: Math.max(1, Math.min(maxColumns, columns)) });
  }

  const title = ru ? "Размер таблицы" : "Table size";
  return <div className={styles.tableInsert} data-toolbar-item>
    <ProductDocToolbarButton label={ru ? "Вставить таблицу" : "Insert table"} isIconOnly isDisabled={disabled}
      onMouseDown={(event) => event.preventDefault()} onPress={() => insert(defaultSize)}>
      <Table2 size={16} />
    </ProductDocToolbarButton>
    <Popover isOpen={open && !disabled} onOpenChange={(next) => {
      if (next) setSize(defaultSize);
      setOpen(next);
    }} placement="bottom-end" offset={6} containerPadding={10} shouldBlockScroll={false} shouldCloseOnScroll={false}
      disableAnimation={Boolean(reduced)} motionProps={{ variants: toolbarMenuMotion }} style={{ zIndex: 160 }}
      classNames={{ content: styles.sizePicker }}>
      <PopoverTrigger>
        <ProductDocToolbarButton label={title} isIconOnly className={styles.sizeTrigger} isDisabled={disabled} onPointerDownCapture={selection.remember} onKeyDownCapture={selection.rememberOnKey}>
          <ChevronDown size={12} aria-hidden="true" />
        </ProductDocToolbarButton>
      </PopoverTrigger>
      <PopoverContent data-editor-dialog aria-label={ru ? "Выберите размер таблицы" : "Choose table size"}>
        <div className={styles.sizeGrid} ref={grid}>
          {Array.from({ length: maxRows * maxColumns }, (_, index) => {
            const rows = Math.floor(index / maxColumns) + 1;
            const columns = index % maxColumns + 1;
            const current = size.rows === rows && size.columns === columns;
            return <button key={index} type="button" className={styles.sizeCell} data-size={`${columns}x${rows}`}
              data-highlighted={rows <= size.rows && columns <= size.columns} tabIndex={current ? 0 : -1} autoFocus={current}
              aria-label={ru ? `${columns} × ${rows}, колонки × строки` : `${columns} × ${rows}, columns × rows`}
              onFocus={() => setSize({ rows, columns })}
              onPointerEnter={() => setSize({ rows, columns })}
              onMouseDown={(event) => event.preventDefault()} onKeyDown={(event) => navigate(event, rows, columns)}
              onClick={() => insert({ rows, columns })} />;
          })}
        </div>
        <div className={styles.sizeValue}>{size.columns} × {size.rows}</div>
      </PopoverContent>
    </Popover>
  </div>;
}
