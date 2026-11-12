import { ImportSourceError } from "../import-source-error";
import { TEST_CASE_IMPORT_LIMIT } from "../../../model/test-case-exchange";
export type ImportCell = string | number | boolean | null;
export type ImportSheet = { name: string; headers: string[]; cases: Record<string, unknown>[]; sourceCells?: Record<string, unknown>[] };
const has = (object: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(object, key);
const aliases: Record<string, string> = {
  title: "title", summary: "title", name: "title", testcasename: "title", testcasesummary: "title",
  description: "description", preconditions: "preconditions", precondition: "preconditions",
  expectedresult: "expectedResult", expectedresults: "expectedResult", expected: "expectedResult",
  id: "sourceKey", issuekey: "sourceKey", caseid: "sourceKey", section: "folderPath", folderpath: "folderPath",
};

export function buildImportSheet(name: string, cells: ImportCell[][]): ImportSheet {
  const [header, ...body] = cells;
  if (!header?.length || header.length > 256 || header.some(value => typeof value !== "string" || !value.trim())) {
    throw new ImportSourceError("IMPORT_INVALID_COLUMNS");
  }
  const headers = header as string[];
  const rows = body.filter(row => row.some(value => value !== "" && value !== null));
  if (rows.length > TEST_CASE_IMPORT_LIMIT) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
  const cases = rows.map(row => {
    if (row.length !== headers.length) throw new ImportSourceError("IMPORT_INVALID_COLUMNS");
    const record: Record<string, unknown> = Object.create(null);
    const candidates: Record<string, ImportCell[]> = Object.create(null);
    const sourceColumns = headers.map((name, index) => ({ name, value: row[index] }));
    for (const { name, value } of sourceColumns) {
      if (has(record, name)) record[name] = Array.isArray(record[name]) ? [...record[name] as unknown[], value] : [record[name], value];
      else record[name] = value;
      const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const alias = has(aliases, normalized) ? aliases[normalized] : undefined;
      if (alias) (candidates[alias] ??= []).push(value);
    }
    for (const [alias, values] of Object.entries(candidates)) {
      if (values.length !== 1) throw new ImportSourceError("IMPORT_AMBIGUOUS_COLUMNS");
      if (!has(record, alias)) record[alias] = values[0];
    }
    if (!has(record, "folderPath")) record.folderPath = `/${name}`;
    record.sourceColumns = sourceColumns;
    return record;
  });
  return { name, headers, cases };
}
