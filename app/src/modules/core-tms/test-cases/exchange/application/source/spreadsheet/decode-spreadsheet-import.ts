import { ImportSourceError } from "../import-source-error";
import { TEST_CASE_IMPORT_LIMIT } from "../../../model/test-case-exchange";
import { buildImportSheet, type ImportCell, type ImportSheet } from "../tabular/build-import-sheet";
import { checkWorkbookContainer } from "./check-workbook-container";

export async function decodeSpreadsheetImport(file: File, extension: "xlsx" | "xls"): Promise<unknown> {
  await checkWorkbookContainer(file, extension);
  const { read, utils } = await import("xlsx");
  const workbook = read(await file.arrayBuffer(), { type: "array", nodim: true, WTF: true,
    cellHTML: false, cellStyles: false, cellFormula: true, cellText: false, cellDates: false });
  if (!workbook.SheetNames.length || workbook.SheetNames.length > 32) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
  const sheets: ImportSheet[] = []; let count = 0; let cellCount = 0;
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const cells = Object.keys(sheet).filter(key => !key.startsWith("!"));
    if (!cells.length) continue;
    const positions = cells.map(address => utils.decode_cell(address));
    const range = { s: { r: Infinity, c: Infinity }, e: { r: 0, c: 0 } };
    for (const { r, c } of positions) {
      if (!Number.isSafeInteger(r) || !Number.isSafeInteger(c) || r < 0 || c < 0) throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
      range.s.r = Math.min(range.s.r, r); range.s.c = Math.min(range.s.c, c);
      range.e.r = Math.max(range.e.r, r); range.e.c = Math.max(range.e.c, c);
    }
    if (range.e.r > TEST_CASE_IMPORT_LIMIT || range.e.c >= 256) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
    const rows: ImportCell[][] = [];
    const sourceCells: Record<string, unknown>[] = [];
    for (let row = range.s.r; row <= range.e.r; row++) {
      const values: ImportCell[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const address = utils.encode_cell({ r: row, c: col }); const cell = sheet[address];
        if (cell && ++cellCount > 100_000) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
        const value: unknown = cell?.f ? `=${cell.f}` : cell?.v ?? "";
        if (typeof value === "number" && (!Number.isFinite(value) || (Number.isInteger(value) && !Number.isSafeInteger(value)))) throw new ImportSourceError("IMPORT_UNSAFE_NUMBER");
        if (value !== null && !["string", "number", "boolean"].includes(typeof value)) throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
        values.push(value as ImportCell);
        if (cell) sourceCells.push({ address, type: cell.t, value: cell.v ?? null, ...(cell.f ? { formula: cell.f } : {}) });
      }
      rows.push(values);
    }
    if (!rows.length || rows.every(row => row.every(value => value === ""))) continue;
    const imported = buildImportSheet(name, rows);
    count += imported.cases.length;
    if (count > TEST_CASE_IMPORT_LIMIT) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
    sheets.push({ ...imported, sourceCells });
  }
  if (!count) throw new ImportSourceError("IMPORT_NO_RECORDS");
  return { format: "spreadsheet", sheets };
}
