import { ImportSourceError } from "../import-source-error";
import Papa from "papaparse";
import { buildImportSheet } from "../tabular/build-import-sheet";

export function decodeDelimitedImport(text: string, format: "csv" | "tsv", name: string): unknown {
  const result = Papa.parse<string[]>(text, {
    delimiter: format === "tsv" ? "\t" : "", delimitersToGuess: [",", ";", "\t", "|"],
    header: false, dynamicTyping: false, skipEmptyLines: false, worker: false,
  });
  if (result.errors.some(error => error.code !== "UndetectableDelimiter")) throw new ImportSourceError("IMPORT_INVALID_CSV");
  const sheet = buildImportSheet(name.replace(/\.[^.]+$/, ""), result.data);
  if (!sheet.cases.length) throw new ImportSourceError("IMPORT_NO_RECORDS");
  return { format, sheets: [sheet] };
}
