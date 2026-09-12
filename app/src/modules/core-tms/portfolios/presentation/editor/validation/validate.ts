import { validChecklist } from "../../../management/model/organization";

export function organizationErrors(input: { name: string; key?: string; description: string; testingPlan?: string; checklist: Parameters<typeof validChecklist>[0] }, ru: boolean) {
  const errors: Record<string, string> = {};
  if (!input.name.trim()) errors.name = ru ? "Введите название." : "Enter a name.";
  else if (input.name.trim().length > 120) errors.name = ru ? "Максимум 120 символов." : "Maximum 120 characters.";
  if (input.key !== undefined && !/^[A-Z][A-Z0-9]{1,11}$/.test(input.key.trim())) errors.key = ru ? "Укажите ключ: 2–12 латинских букв или цифр, начиная с буквы. Например, MOBILE." : "Enter a key: 2–12 uppercase letters or digits, starting with a letter. For example, MOBILE.";
  if (input.description.length > 20000) errors.description = ru ? "Максимум 20 000 символов." : "Maximum 20,000 characters.";
  if ((input.testingPlan?.length ?? 0) > 20000) errors.plan = ru ? "Максимум 20 000 символов." : "Maximum 20,000 characters.";
  if (!validChecklist(input.checklist)) errors.checklist = ru ? "Заполните пункты чек-листа." : "Complete the checklist items.";
  return errors;
}

export function focusOrganizationError(form: HTMLFormElement, errors: Record<string, string>) {
  const key = Object.keys(errors)[0];
  const target = form.querySelector<HTMLElement>(`[data-field="${key}"]`);
  target?.scrollIntoView({ block: "center", behavior: "smooth" });
  target?.focus({ preventScroll: true });
}
