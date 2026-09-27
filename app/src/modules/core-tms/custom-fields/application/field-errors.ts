import { TmsApiError } from "../../../../core/tms/transport/http";
import type { CustomFieldValue } from "../model/custom-field";
export type ValueConflict = { kind: "exact"; values: readonly CustomFieldValue[] } | { kind: "similar"; values: readonly CustomFieldValue[] };
function value(value: unknown): value is CustomFieldValue {
  return typeof value === "object" && value !== null && "id" in value && typeof value.id === "string"
    && "label" in value && typeof value.label === "string" && "value" in value
    && ["string", "number", "boolean"].includes(typeof value.value);
}
export function customValueConflict(failure: unknown): ValueConflict | null {
  if (!(failure instanceof TmsApiError) || failure.status !== 409) return null;
  const details = failure.details;
  if (details?.reason === "EXACT_VALUE_EXISTS" && value(details.existingValue)) return { kind: "exact", values: [details.existingValue] };
  if (details?.reason === "SIMILAR_VALUES_EXIST" && Array.isArray(details.similarValues)) {
    const values = details.similarValues.filter(value).slice(0, 100);
    if (values.length) return { kind: "similar", values };
  }
  return null;
}
export function customFieldError(failure: unknown, ru: boolean): string {
  if (failure instanceof TmsApiError) {
    if (failure.status === 401) return ru ? "Войдите снова, чтобы продолжить." : "Sign in again to continue.";
    if (failure.status === 403) return ru ? "Недостаточно прав для этого действия." : "You do not have permission for this action.";
    if (failure.status === 412) return ru ? "Данные изменились. Обновите страницу и повторите правку." : "This item changed. Refresh and try again.";
    if (failure.details?.reason === "FIELD_IN_USE") return ru ? "Поле уже используется. Его тип, идентификатор и количество значений изменить нельзя." : "This field is in use. Its type, identifier and number of values cannot be changed.";
    if (failure.status === 409) return ru ? "Такое поле или значение уже существует либо используется. Обновите список." : "This field or value already exists or is in use. Refresh the list.";
    if (failure.status === 400 || failure.status === 422) return ru ? "Проверьте название, тип и выбранную группу." : "Check the name, type and selected group.";
  }
  return ru ? "Не удалось загрузить или сохранить данные. Попробуйте ещё раз." : "Could not load or save the data. Try again.";
}
