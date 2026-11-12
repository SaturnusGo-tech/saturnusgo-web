import { visit } from "jsonc-parser";
import { ImportSourceError } from "../import-source-error";
import { assertImportNumber } from "./assert-import-number";

export function parseStrictImportJson(text: string): unknown {
  const objects: Set<string>[] = []; let depth = 0;
  const begin = () => { if (++depth > 100) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED"); };
  visit(text, {
    onObjectBegin() { begin(); objects.push(new Set()); },
    onObjectProperty(name) {
      const names = objects[objects.length - 1];
      if (names.has(name)) throw new ImportSourceError("IMPORT_DUPLICATE_JSON_KEYS");
      names.add(name);
    },
    onObjectEnd() { objects.pop(); depth--; },
    onArrayBegin: begin, onArrayEnd() { depth--; },
    onLiteralValue(value, offset, length) {
      if (typeof value === "number") assertImportNumber(text.slice(offset, offset + length), value);
    },
    onError() { throw new ImportSourceError("IMPORT_INVALID_JSON"); },
  }, { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false });
  try { return JSON.parse(text); } catch { throw new ImportSourceError("IMPORT_INVALID_JSON"); }
}
