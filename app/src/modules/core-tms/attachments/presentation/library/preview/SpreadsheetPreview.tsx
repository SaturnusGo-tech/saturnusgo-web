"use client";

import { Tab, Tabs } from "@heroui/react";
import { useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { columnName, type PreviewSheet } from "./model/file-preview-format";
import styles from "./attachment-file-preview.module.css";

const rowHeaderWidth = 44;
const rowHeight = 22;
const defaultColumnWidth = 140;

function visibleRange(offsets: number[], start: number, end: number) {
  const first = offsets.findIndex((offset, index) => index > 0 && offset > start) - 1;
  const last = offsets.findIndex(offset => offset >= end);
  return [Math.max(0, first - 1), last < 0 ? offsets.length - 1 : Math.min(last + 1, offsets.length - 1)] as const;
}

function SheetGrid({ sheet, scale, ru }: { sheet: PreviewSheet; scale: number; ru: boolean }) {
  const gridId = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [active, setActive] = useState({ row: 0, column: 0 });
  const rowStep = rowHeight * scale;
  const gutter = rowHeaderWidth * scale;
  const offsets = useMemo(() => {
    const positions = [0];
    for (let column = 0; column < sheet.columns; column++) {
      positions.push(positions[column] + (sheet.widths[column] ?? defaultColumnWidth) * scale);
    }
    while (positions[positions.length - 1] + gutter < bounds.width) {
      positions.push(positions[positions.length - 1] + defaultColumnWidth * scale);
    }
    return positions;
  }, [sheet.columns, sheet.widths, scale, bounds.width]);
  const rowCount = Math.max(sheet.rows, Math.ceil(bounds.height / rowStep));
  const columnCount = offsets.length - 1;
  const [startColumn, endColumn] = visibleRange(offsets, bounds.left, bounds.left + bounds.width - gutter);
  const firstRow = Math.max(0, Math.floor(bounds.top / rowStep) - 2);
  const lastRow = Math.min(rowCount, Math.ceil((bounds.top + bounds.height) / rowStep) + 2);
  const columns = Array.from({ length: endColumn - startColumn }, (_, index) => startColumn + index);
  const rows = Array.from({ length: lastRow - firstRow }, (_, index) => firstRow + index);
  const cellId = (row: number, column: number) => `${gridId}-${row}-${column}`;
  const value = sheet.cells[active.row]?.[active.column];

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    function measure() {
      if (element) setBounds({ top: element.scrollTop, left: element.scrollLeft, width: element.clientWidth, height: element.clientHeight });
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", measure);
    };
  }, []);

  function move(event: KeyboardEvent) {
    const element = viewport.current;
    if (!element || event.altKey || event.ctrlKey || event.metaKey) return;
    let { row, column } = active;
    const pageRows = Math.max(1, Math.floor(bounds.height / rowStep) - 1);
    switch (event.key) {
      case "ArrowUp": row--; break;
      case "ArrowDown": row++; break;
      case "ArrowLeft": column--; break;
      case "ArrowRight": column++; break;
      case "PageUp": row -= pageRows; break;
      case "PageDown": row += pageRows; break;
      case "Home": column = 0; break;
      case "End": column = columnCount - 1; break;
      default: return;
    }
    event.preventDefault();
    row = Math.max(0, Math.min(rowCount - 1, row));
    column = Math.max(0, Math.min(columnCount - 1, column));
    setActive({ row, column });
    if (row * rowStep < element.scrollTop) element.scrollTop = row * rowStep;
    else if ((row + 2) * rowStep > element.scrollTop + element.clientHeight) element.scrollTop = (row + 2) * rowStep - element.clientHeight;
    if (offsets[column] < element.scrollLeft) element.scrollLeft = offsets[column];
    else if (offsets[column + 1] + gutter > element.scrollLeft + element.clientWidth) element.scrollLeft = offsets[column + 1] + gutter - element.clientWidth;
  }

  function columnStyle(column: number) {
    return { left: gutter + offsets[column], width: offsets[column + 1] - offsets[column] };
  }

  return <>
    <div className={styles.formulaBar} aria-label={ru ? "Формула" : "Formula bar"}>
      <span>{columnName(active.column)}{active.row + 1}</span>
      <i aria-hidden="true">ƒx</i>
      <span title={value?.formula ? `=${value.formula}` : value?.text}>{value?.formula ? `=${value.formula}` : value?.text}</span>
    </div>
    <div ref={viewport} className={styles.sheetViewport} role="grid" aria-label={sheet.name}
      aria-readonly="true" aria-rowcount={rowCount + 1} aria-colcount={columnCount + 1} tabIndex={0} onKeyDown={move}
      aria-activedescendant={rows.includes(active.row) && columns.includes(active.column) ? cellId(active.row, active.column) : undefined}
      style={{ "--grid-row": `${rowStep}px`, "--grid-gutter": `${gutter}px`, fontSize: 12 * scale } as CSSProperties}>
      <div className={styles.sheetSurface} style={{ width: gutter + offsets[columnCount], height: (rowCount + 1) * rowStep }}>
        <div className={styles.columnHeaders} role="row" aria-rowindex={1}>
          <span className={styles.rowHeader} role="columnheader" aria-colindex={1} />
          {columns.map(column => <span className={styles.columnHeader} data-current={active.column === column || undefined} key={column}
            style={columnStyle(column)} role="columnheader" aria-colindex={column + 2}>{columnName(column)}</span>)}
        </div>
        {rows.map(row => <div key={row} role="row" className={styles.sheetRow} aria-rowindex={row + 2} style={{ top: (row + 1) * rowStep }}>
          <span className={styles.rowHeader} data-current={active.row === row || undefined} role="rowheader" aria-colindex={1}>{row + 1}</span>
          {columns.map(column => {
            const cell = sheet.cells[row]?.[column];
            const selected = active.row === row && active.column === column;
            return <div key={column} id={cellId(row, column)} role="gridcell" aria-colindex={column + 2} aria-selected={selected}
              className={styles.cell} style={columnStyle(column)} title={cell?.text}
              onClick={() => { setActive({ row, column }); viewport.current?.focus({ preventScroll: true }); }}>{cell?.text}</div>;
          })}
        </div>)}
      </div>
    </div>
  </>;
}

export function SpreadsheetPreview({ sheets, limited, scale, ru }: {
  sheets: PreviewSheet[]; limited: boolean; scale: number; ru: boolean;
}) {
  const [sheetIndex, setSheetIndex] = useState(0);
  return <div className={styles.sheetPreview}>
    <SheetGrid key={sheetIndex} sheet={sheets[sheetIndex]} scale={scale} ru={ru} />
    <div className={styles.sheetFooter}>
      <Tabs aria-label={ru ? "Листы книги" : "Workbook sheets"} selectedKey={String(sheetIndex)}
        onSelectionChange={key => setSheetIndex(Number(key))} size="sm" disableAnimation
        classNames={{ base: styles.sheetTabsBase, tabList: styles.sheetTabs, tab: styles.sheetTab, tabContent: styles.sheetTabText, cursor: styles.sheetTabCursor }}>
        {sheets.map((sheet, index) => <Tab key={String(index)} title={sheet.name} />)}
      </Tabs>
      {limited && <span className={styles.limit} role="status">{ru ? "Показана часть книги" : "Partial workbook preview"}</span>}
    </div>
  </div>;
}
