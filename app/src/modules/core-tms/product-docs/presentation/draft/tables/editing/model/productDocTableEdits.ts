import type { Table, TableCell, TableRow } from "mdast";

const rowLimit = 60;
const columnLimit = 20;
const cellLimit = 600;
export const fitsProductDocTable = (rows: number, columns: number) =>
  rows > 0 && columns > 0 && rows <= rowLimit && columns <= columnLimit && rows * columns <= cellLimit;

function plainCell(value = ""): TableCell {
  return { type: "tableCell", children: value ? [{ type: "text", value }] : [] };
}

export function applyProductDocTablePaste(table: Table, row: number, column: number, cells: string[][]): Table | null {
  const width = cells[0]?.length ?? 0;
  if (!fitsProductDocTable(cells.length, width) || cells.some((entry) => entry.length !== width)) return null;
  if (row < 0 || column < 0 || !table.children[row]?.children[column]) return null;
  const rows = Math.max(table.children.length, row + cells.length);
  const columns = Math.max(...table.children.map((entry) => entry.children.length), column + width);
  if (!fitsProductDocTable(rows, columns)) return null;

  const children = Array.from({ length: rows }, (_, r): TableRow => ({
    type: "tableRow",
    children: Array.from({ length: columns }, (_, c) => {
      const pasted = cells[r - row]?.[c - column];
      if (pasted !== undefined) return plainCell(pasted);
      const existing = table.children[r]?.children[c];
      return existing ? structuredClone(existing) : plainCell();
    }),
  }));
  return { ...table, children };
}

export function canGrowProductDocTableOnTab({ rows, columns, row, column, lastRowHasContent }: {
  rows: number; columns: number; row: number; column: number; lastRowHasContent: boolean;
}) {
  return row === rows - 1 && column === columns - 1 && lastRowHasContent && fitsProductDocTable(rows + 1, columns);
}
