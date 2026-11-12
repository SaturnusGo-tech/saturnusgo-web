import { parseStrictImportJson } from "./json/parse-strict-json";
import { adaptProviderSource } from "./providers/adapt-provider-source";
import { ImportSourceError } from "./import-source-error";
import { TEST_CASE_IMPORT_BYTES, TEST_CASE_IMPORT_LIMIT } from "../../model/test-case-exchange";
import { decodeDelimitedImport } from "./csv/decode-delimited-import";
import { decodeXmlImport } from "./xml/decode-xml-import";
import { decodeSpreadsheetImport } from "./spreadsheet/decode-spreadsheet-import";

export type DecodedImportFile = {
  source: unknown;
  nativeText?: string;
  mimeType: "application/json" | "text/plain" | "application/octet-stream";
};

export async function decodeImportFile(file: File): Promise<DecodedImportFile> {
  if (!file.size) throw new ImportSourceError("IMPORT_NO_RECORDS");
  if (file.size > TEST_CASE_IMPORT_BYTES) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "xlsx" || extension === "xls") {
    try { return { source: await decodeSpreadsheetImport(file, extension), mimeType: "application/octet-stream" }; }
    catch (error) { if (error instanceof ImportSourceError) throw error; throw new ImportSourceError("IMPORT_INVALID_WORKBOOK"); }
  }
  if (!["json", "csv", "tsv", "xml"].includes(extension ?? "")) throw new ImportSourceError("IMPORT_UNSUPPORTED_FORMAT");
  let nativeText: string;
  try { nativeText = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(await file.arrayBuffer()); }
  catch { throw new ImportSourceError("IMPORT_INVALID_UTF8"); }
  const text = nativeText.replace(/^\uFEFF/, "");
  if (extension === "csv" || extension === "tsv") {
    return { source: decodeDelimitedImport(text, extension, file.name), nativeText, mimeType: "text/plain" };
  }
  if (extension === "xml") {
    try { return { source: decodeXmlImport(text), nativeText, mimeType: "text/plain" }; }
    catch (error) { if (error instanceof ImportSourceError) throw error; throw new ImportSourceError("IMPORT_INVALID_XML"); }
  }
  const source = parseStrictImportJson(text);
  if (!source || typeof source !== "object") throw new ImportSourceError("IMPORT_NO_RECORDS");
  if (Array.isArray(source) && (!source.length || source.length > TEST_CASE_IMPORT_LIMIT)) {
    throw new ImportSourceError(source.length ? "IMPORT_LIMIT_EXCEEDED" : "IMPORT_NO_RECORDS");
  }
  return { source: adaptProviderSource(source), nativeText, mimeType: "application/json" };
}
