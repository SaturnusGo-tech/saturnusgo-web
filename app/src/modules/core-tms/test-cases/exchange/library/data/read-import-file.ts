import { TEST_CASE_IMPORT_BYTES } from "../../model/test-case-exchange";
import type { PrivateAttachmentClient } from "../../../../attachments/application/private-attachment-client";
import { decodeSpreadsheetImport } from "../../application/source/spreadsheet/decode-spreadsheet-import";
import type { ImportSheet } from "../../application/source/tabular/build-import-sheet";
import { parseStrictImportJson } from "../../application/source/json/parse-strict-json";

export async function readImportFile(client: PrivateAttachmentClient, id: string, signal: AbortSignal, fileName?: string) {
  const access = await client.createAccess({ attachmentId: id, disposition: "inline", signal });
  const response = await fetch(access.url, { signal, credentials: "omit", redirect: "error", cache: "no-store" });
  if (!response.ok) throw new Error("FILE_UNAVAILABLE");
  const bytes = await response.arrayBuffer();
  signal.throwIfAborted();
  if (bytes.byteLength > TEST_CASE_IMPORT_BYTES) throw new Error("FILE_TOO_LARGE");
  const extension = fileName?.split(".").pop()?.toLowerCase();
  if (extension === "xlsx" || extension === "xls") {
    const source = await decodeSpreadsheetImport(new File([bytes], fileName!), extension) as { sheets: ImportSheet[] };
    signal.throwIfAborted();
    return JSON.stringify({ sheets: source.sheets.map(sheet => ({ name: sheet.name, headers: sheet.headers,
      rows: sheet.cases.map(item => (item.sourceColumns as { value: unknown }[]).map(cell => cell.value)) })) }, null, 2);
  }
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  try { return JSON.stringify(parseStrictImportJson(text.replace(/^\uFEFF/, "")), null, 2); }
  catch { return text; }
}
