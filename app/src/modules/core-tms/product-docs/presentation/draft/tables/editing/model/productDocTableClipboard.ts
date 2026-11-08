import { fitsProductDocTable } from "./productDocTableEdits";

export function parseProductDocTableClipboard(text: string, spreadsheetMime = false): string[][] | null {
  if (!text.trim() || text.length > 16_384) return null;
  const input = text.replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  let closedQuote = false;
  let tabs = false;
  let endedRow = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    endedRow = false;
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
        closedQuote = true;
      } else {
        value += char === "\n" || char === "\t" ? " " : char;
      }
    } else if (char === "\t" || char === "\n") {
      row.push(value);
      value = "";
      closedQuote = false;
      if (char === "\t") {
        tabs = true;
      } else {
        rows.push(row);
        row = [];
        endedRow = true;
      }
    } else if (closedQuote) {
      return null;
    } else if (char === '"' && value === "") {
      quoted = true;
    } else {
      value += char;
    }
  }
  if (quoted || (!tabs && !spreadsheetMime)) return null;
  if (!endedRow) rows.push([...row, value]);
  const columns = rows[0]?.length ?? 0;
  if (!fitsProductDocTable(rows.length, columns) || rows.some((entry) => entry.length !== columns)) return null;
  if (rows.length * columns < 2) return null;
  return rows;
}
