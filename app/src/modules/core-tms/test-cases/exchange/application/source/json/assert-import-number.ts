import { ImportSourceError } from "../import-source-error";

export function assertImportNumber(token: string, value: number): void {
  if (!Number.isFinite(value) || Object.is(value, -0) || (Number.isInteger(value) && !Number.isSafeInteger(value))
    || decimalValue(token.trim()) !== decimalValue(String(value))) throw new ImportSourceError("IMPORT_UNSAFE_NUMBER");
}

// Compare decimal token values before a parser can replace them with rounded numbers.
function decimalValue(token: string): string {
  const [mantissa, exponent = "0"] = token.toLowerCase().replace(/^\+/, "").split("e");
  const sign = mantissa.startsWith("-") ? "-" : "";
  const unsigned = sign ? mantissa.slice(1) : mantissa;
  const fraction = unsigned.split(".")[1]?.length ?? 0;
  const digits = unsigned.replace(".", "").replace(/^0+/, "");
  if (!digits) return "0";
  const significant = digits.replace(/0+$/, "");
  return `${sign}${significant}e${Number(exponent) - fraction + digits.length - significant.length}`;
}
