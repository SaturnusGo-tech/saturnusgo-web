import type { SourceImportFile } from "../../model/source-import/source-import-file";
import { readSourceWorkbook } from "./workbook/read-source-workbook";
export async function readSourceImportFile(file: File, signal: AbortSignal): Promise<SourceImportFile> {
  signal.throwIfAborted();
  if (!file.size || file.size > 5_000_000) throw new Error("DATA_IMPORT_FILE_LIMIT");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "xlsx" || extension === "xls") return { name: file.name, format: "CSV", sheets: await readSourceWorkbook(file, extension, signal) };
  if (extension !== "csv" && extension !== "json") throw new Error("DATA_IMPORT_UNSUPPORTED_FORMAT");
  const content = await file.text(); signal.throwIfAborted();
  return { name: file.name, format: extension === "json" ? "JSON" : "CSV", sheets: [{ name: file.name.replace(/\.[^.]+$/, ""), content }] };
}
