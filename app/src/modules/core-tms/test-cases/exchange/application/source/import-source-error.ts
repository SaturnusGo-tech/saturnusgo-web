const messages = {
  IMPORT_UNSAFE_NUMBER: "A number would lose precision. Export long identifiers and precise values as text.",
  IMPORT_DUPLICATE_JSON_KEYS: "The JSON repeats a property name in the same object. Keep each source value under a unique key.",
  IMPORT_INCOMPLETE_PROVIDER: "The provider file contains a partial response or unresolved shared content. Export all pages and referenced data.",
  IMPORT_INVALID_PROVIDER: "The provider export has missing or inconsistent records or references.",
  IMPORT_LIMIT_EXCEEDED: "The import exceeds the 5 MB, record or workbook expansion limit.",
  IMPORT_NO_RECORDS: "The file contains no importable records.",
  IMPORT_UNSUPPORTED_FORMAT: "Choose a JSON, CSV, TSV, XML, XLSX or XLS file.",
  IMPORT_INVALID_UTF8: "Text files must use valid UTF-8 encoding.",
  IMPORT_INVALID_JSON: "The file contains invalid JSON.",
  IMPORT_INVALID_CSV: "The file contains malformed delimited data.",
  IMPORT_INVALID_XML: "The file contains invalid XML.",
  IMPORT_UNSAFE_XML: "XML document type and entity declarations are not supported.",
  IMPORT_XML_MIXED_CONTENT: "Convert mixed XML text and markup to a text field before importing.",
  IMPORT_INVALID_WORKBOOK: "The workbook is invalid or uses an unsupported container.",
  IMPORT_INVALID_COLUMNS: "Every data row must match the nonempty column headers.",
  IMPORT_AMBIGUOUS_COLUMNS: "The file has multiple columns for the same case title, ID or field.",
} as const;
export type ImportSourceErrorCode = keyof typeof messages;
export class ImportSourceError extends Error {
  constructor(readonly code: ImportSourceErrorCode) { super(messages[code]); this.name = "ImportSourceError"; }
}
