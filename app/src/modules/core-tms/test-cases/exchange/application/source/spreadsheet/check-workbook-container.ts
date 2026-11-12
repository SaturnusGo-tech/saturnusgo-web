import { checkWorkbookXml } from "./xml/check-workbook-xml";
import { ImportSourceError } from "../import-source-error";
import { BlobReader, ZipReader } from "@zip.js/zip.js";
const expandedByteLimit = 20_000_000;

export async function checkWorkbookContainer(file: File, extension: "xlsx" | "xls"): Promise<void> {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (extension === "xls") {
    if (![0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every((value, index) => header[index] === value)) {
      throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
    }
    return;
  }
  if (header[0] !== 0x50 || header[1] !== 0x4b) throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
  const reader = new ZipReader(new BlobReader(file));
  let entries = 0; let declared = 0; let actual = 0; let hasWorkbook = false;
  const budget = { cells: 0, nodes: 0 };
  try {
    for await (const entry of reader.getEntriesGenerator()) {
      declared += entry.uncompressedSize;
      if (++entries > 4096 || !Number.isSafeInteger(declared) || declared > expandedByteLimit || entry.encrypted) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
      if (entry.filename === "xl/workbook.xml") hasWorkbook = true;
      if (entry.directory) continue;
      let entryBytes = 0;
      const xmlChunks: Uint8Array[] | undefined = /\.xml$/i.test(entry.filename) ? [] : undefined;
      await entry.getData(new WritableStream<Uint8Array>({ write(chunk) {
        actual += chunk.byteLength; entryBytes += chunk.byteLength;
        xmlChunks?.push(chunk.slice());
        if (actual > expandedByteLimit || entryBytes > entry.uncompressedSize) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
      } }), { useWebWorkers: false, checkSignature: true });
      if (entryBytes !== entry.uncompressedSize) throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
      if (xmlChunks) {
        const bytes = new Uint8Array(entryBytes); let offset = 0;
        for (const chunk of xmlChunks) { bytes.set(chunk, offset); offset += chunk.length; }
        await checkWorkbookXml(bytes, budget);
      }
    }
    if (!hasWorkbook) throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
  } finally { await reader.close(); }
}
