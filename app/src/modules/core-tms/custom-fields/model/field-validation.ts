import type { CustomFieldDraft, CustomFieldType } from "./custom-field";

export function fieldDraftError(draft: CustomFieldDraft, ru: boolean): string {
  if (!draft.name.trim()) return ru ? "Введите название поля." : "Enter a field name.";
  if (draft.name.trim().length > 200) return ru ? "Название: до 200 символов." : "Use up to 200 characters for the name.";
  if (!/^[a-z][a-z0-9_.-]{0,63}$/.test(draft.identifier)) return ru
    ? "Идентификатор: начните с латинской буквы; строчные буквы, цифры, точки, дефисы и подчёркивания; до 64 символов."
    : "Identifier: start with a lowercase letter; use letters, digits, dots, hyphens and underscores; up to 64 characters.";
  return "";
}
export function parseFieldValue(input: string, type: CustomFieldType): string | number | boolean | null {
  const text = input.trim(); if (!text) return null;
  if (type === "string") return text.length <= 500 ? text : null;
  if (type === "boolean") return text === "true" ? true : text === "false" ? false : null;
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) && (type !== "integer" || Number.isSafeInteger(value)) ? value : null;
}
export const normalizedFieldLabel = (value: string) => value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
