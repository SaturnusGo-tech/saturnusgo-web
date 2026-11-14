import type { DataType } from "../../model/bindings/binding";
export function parseDataInput(type: DataType, text: string): string | boolean {
  if (type === "Boolean") return text === "true";
  if (type === "JSON") JSON.parse(text);
  return text;
}
export function formatDataValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value) ?? "";
}
