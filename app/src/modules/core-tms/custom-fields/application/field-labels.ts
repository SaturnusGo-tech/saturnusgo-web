import type { CustomFieldDefinition, CustomFieldSelection } from "../model/custom-field";
export function customValueLabel(value: CustomFieldSelection, _ru: boolean) {
  return typeof value.value === "boolean" ? String(value.value) : value.label;
}
export function customFieldLabel(field: Pick<CustomFieldDefinition, "name" | "systemKey">, ru: boolean) {
  if (field.systemKey === "product_group") return ru ? "Группа продуктов" : "Product group";
  if (field.systemKey === "product") return ru ? "Продукт" : "Product";
  if (field.systemKey === "regression") return ru ? "Регресс" : "Regression";
  return field.name;
}
