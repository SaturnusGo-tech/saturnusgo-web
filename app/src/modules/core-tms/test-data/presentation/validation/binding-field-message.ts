export function bindingFieldMessage(code: string, ru: boolean): string | null {
  if (code === "TEST_DATA_ALIAS_INVALID") return ru
    ? "Alias должен начинаться с латинской буквы и содержать только латинские буквы, цифры и подчёркивания. Например: adminAccount."
    : "Start Alias with a Latin letter; use only Latin letters, digits and underscores. For example: adminAccount.";
  if (code === "TEST_DATA_INPUT_INVALID") return ru
    ? "Проверьте поля привязки: значение не соответствует формату или ограничениям."
    : "Review the binding fields: a value does not match the required format or limits.";
  return null;
}
