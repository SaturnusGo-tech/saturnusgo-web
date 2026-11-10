import { BlobReader, ZipReader } from "@zip.js/zip.js";
import { fileExtension, type FilePreviewRequest, type ParsedFilePreview, type PreviewSheet } from "../model/file-preview-format";
import { parseArchivePreview } from "./archive/archive-preview";
import { decodeTextPreview, textByteLimit } from "./text/text-preview";

const rowLimit = 10_000;
const columnLimit = 256;
const sheetLimit = 100;
const cellLimit = 100_000;
const characterLimit = 4_000_000;
const cellLengthLimit = 4096;
const archiveByteLimit = 64 * 1024 * 1024;

async function checkWorkbookContainer(blob: Blob) {
  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  if (header[0] !== 0x50 || header[1] !== 0x4b) return;
  const reader = new ZipReader(new BlobReader(blob));
  try {
    let count = 0;
    let declaredSize = 0;
    let actualSize = 0;
    for await (const entry of reader.getEntriesGenerator()) {
      declaredSize += entry.uncompressedSize;
      if (++count > 4096 || declaredSize > archiveByteLimit || entry.encrypted) throw new Error("Workbook exceeds preview limits");
      if (entry.directory) continue;
      await entry.getData(new WritableStream<Uint8Array>({
        write(chunk) {
          actualSize += chunk.byteLength;
          if (actualSize > archiveByteLimit) throw new Error("Workbook exceeds preview limits");
        },
      }), { useWebWorkers: false, checkSignature: true });
    }
  } finally {
    await reader.close();
  }
}

export async function parseFilePreview(request: FilePreviewRequest): Promise<ParsedFilePreview> {
  const { kind, blob, filename, mimeType } = request;
  if (kind === "text") {
    const limited = blob.size > textByteLimit;
    const bytes = new Uint8Array(await blob.slice(0, textByteLimit).arrayBuffer());
    return decodeTextPreview(bytes, limited, filename, mimeType);
  }
  if (kind === "archive" || kind === "archive-entry") return parseArchivePreview(blob, kind === "archive-entry" ? filename : undefined);

  await checkWorkbookContainer(blob);
  const { read, utils } = await import("xlsx");
  const extension = fileExtension(filename);
  const delimiter = extension === "tsv" ? "\t" : undefined;
  const workbook = read(await blob.arrayBuffer(), {
    type: "array",
    sheetRows: rowLimit + 1,
    cellHTML: false,
    cellStyles: true,
    cellText: true,
    cellFormula: true,
    raw: extension === "csv" || extension === "tsv",
    FS: delimiter,
  });
  let limited = workbook.SheetNames.length > sheetLimit;
  let count = 0;
  let characters = 0;
  const sheets: PreviewSheet[] = [];
  for (const name of workbook.SheetNames.slice(0, sheetLimit)) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const range = utils.decode_range(sheet["!fullref"] ?? sheet["!ref"] ?? "A1");
    if (range.e.r >= rowLimit || range.e.c >= columnLimit) limited = true;
    const cells: PreviewSheet["cells"] = {};
    for (const address of Object.keys(sheet)) {
      if (!/^[A-Z]{1,3}[1-9][0-9]*$/.test(address)) continue;
      const { r, c } = utils.decode_cell(address);
      if (r >= rowLimit || c >= columnLimit) continue;
      const cell = sheet[address];
      if (cell?.v == null && !cell?.f) continue;
      if (count >= cellLimit || characters >= characterLimit) {
        limited = true;
        break;
      }
      const value = String(cell.w ?? cell.v ?? "");
      const formula = typeof cell.f === "string" ? cell.f : undefined;
      if (value.length > cellLengthLimit || (formula?.length ?? 0) > cellLengthLimit) limited = true;
      (cells[r] ??= {})[c] = { text: value.slice(0, cellLengthLimit), formula: formula?.slice(0, cellLengthLimit) };
      characters += cells[r][c].text.length + (cells[r][c].formula?.length ?? 0);
      count++;
    }
    const columns = Math.min(columnLimit, Math.max(12, range.e.c + 1));
    const widths = Array.from({ length: columns }, (_, index) => {
      const column = sheet["!cols"]?.[index];
      return column?.wpx ? Math.min(480, Math.max(72, column.wpx)) : null;
    });
    sheets.push({ name, cells, widths, columns, rows: Math.min(rowLimit, Math.max(60, range.e.r + 1)) });
  }
  if (!sheets.length) throw new Error("Workbook has no readable sheets");
  return { kind, sheets, limited };
}
