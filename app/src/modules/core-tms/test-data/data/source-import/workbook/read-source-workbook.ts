import { BlobReader, ZipReader } from "@zip.js/zip.js";
import type { SourceImportFile } from "../../../model/source-import/source-import-file";
async function checkContainer(file: File, extension: "xlsx" | "xls", signal: AbortSignal) {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer()); signal.throwIfAborted();
  if (extension === "xls") {
    if (![0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every((value, index) => header[index] === value)) throw new Error("DATA_IMPORT_INVALID_WORKBOOK");
    return;
  }
  if (header[0] !== 0x50 || header[1] !== 0x4b) throw new Error("DATA_IMPORT_INVALID_WORKBOOK");
  const reader = new ZipReader(new BlobReader(file)); let count = 0, declared = 0, actual = 0, workbook = false;
  try {
    for await (const entry of reader.getEntriesGenerator()) {
      signal.throwIfAborted(); declared += entry.uncompressedSize;
      if (++count > 4096 || !Number.isSafeInteger(declared) || declared > 20_000_000 || entry.encrypted) throw new Error("DATA_IMPORT_FILE_LIMIT");
      if (entry.filename === "xl/workbook.xml") workbook = true;
      if (entry.directory) continue;
      let size = 0;
      await entry.getData(new WritableStream<Uint8Array>({ write(chunk) {
        signal.throwIfAborted(); actual += chunk.byteLength; size += chunk.byteLength;
        if (actual > 20_000_000 || size > entry.uncompressedSize) throw new Error("DATA_IMPORT_FILE_LIMIT");
      } }), { useWebWorkers: false, checkSignature: true });
      if (size !== entry.uncompressedSize) throw new Error("DATA_IMPORT_INVALID_WORKBOOK");
    }
    if (!workbook) throw new Error("DATA_IMPORT_INVALID_WORKBOOK");
  } finally { await reader.close(); }
}
export async function readSourceWorkbook(file: File, extension: "xlsx" | "xls", signal: AbortSignal): Promise<SourceImportFile["sheets"]> {
  await checkContainer(file, extension, signal);
  const { read, utils } = await import("xlsx"); signal.throwIfAborted();
  const workbook = read(await file.arrayBuffer(), { type: "array", nodim: true, WTF: true, cellHTML: false, cellStyles: false, cellFormula: true, cellText: false, cellDates: false });
  if (!workbook.SheetNames.length || workbook.SheetNames.length > 32) throw new Error("DATA_IMPORT_FILE_LIMIT");
  const sheets: { name: string; content: string }[] = []; let total = 0;
  for (const name of workbook.SheetNames) {
    signal.throwIfAborted(); const sheet = workbook.Sheets[name]; if (!sheet) continue;
    const addresses = Object.keys(sheet).filter(key => !key.startsWith("!")); if (!addresses.length) continue;
    const range = { s: { r: Infinity, c: Infinity }, e: { r: 0, c: 0 } };
    for (const address of addresses) {
      const { r, c } = utils.decode_cell(address);
      if (!Number.isSafeInteger(r) || !Number.isSafeInteger(c) || r < 0 || c < 0 || r > 1000 || c >= 200 || ++total > 100_000) throw new Error("DATA_IMPORT_FILE_LIMIT");
      range.s.r = Math.min(range.s.r, r); range.s.c = Math.min(range.s.c, c); range.e.r = Math.max(range.e.r, r); range.e.c = Math.max(range.e.c, c);
      const cell = sheet[address];
      if (cell?.f) sheet[address] = { t: "s", v: `=${cell.f}` };
      else if (typeof cell?.v === "number" && (!Number.isFinite(cell.v) || (Number.isInteger(cell.v) && !Number.isSafeInteger(cell.v)))) throw new Error("DATA_IMPORT_UNSAFE_NUMBER");
    }
    sheet["!ref"] = utils.encode_range(range); const content = utils.sheet_to_csv(sheet, { blankrows: false });
    if (content.trim()) sheets.push({ name, content });
  }
  if (!sheets.length) throw new Error("DATA_IMPORT_NO_ROWS");
  return sheets;
}
