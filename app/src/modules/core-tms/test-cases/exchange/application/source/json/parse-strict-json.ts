import { visit } from "jsonc-parser";
import { ImportSourceError } from "../import-source-error";

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
      if (typeof value !== "number") return;
      if (!Number.isFinite(value) || Object.is(value, -0) || (Number.isInteger(value) && !Number.isSafeInteger(value))
        || decimalValue(text.slice(offset, offset + length)) !== decimalValue(String(value))) throw new ImportSourceError("IMPORT_UNSAFE_NUMBER");
    },
    onError() { throw new ImportSourceError("IMPORT_INVALID_JSON"); },
  }, { disallowComments: true, allowTrailingComma: false, allowEmptyContent: false });
  try { return JSON.parse(text); } catch { throw new ImportSourceError("IMPORT_INVALID_JSON"); }
}

// Compare numeric token values supplied by the parser, without rounding a second time.
function decimalValue(token: string): string {
  const [mantissa, exponent = "0"] = token.toLowerCase().split("e");
  const sign = mantissa.startsWith("-") ? "-" : "";
  const unsigned = sign ? mantissa.slice(1) : mantissa;
  const fraction = unsigned.split(".")[1]?.length ?? 0;
  const digits = unsigned.replace(".", "").replace(/^0+/, "");
  if (!digits) return "0";
  const significant = digits.replace(/0+$/, "");
  return `${sign}${significant}e${Number(exponent) - fraction + digits.length - significant.length}`;
}
