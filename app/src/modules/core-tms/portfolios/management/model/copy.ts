import type { WorkflowPhase } from "./organization";
export function organizationCopy(locale: string) {
  const ru = locale === "ru";
  return {
    phase: ru ? "Статус" : "Status", checklist: ru ? "Чек-лист" : "Checklist",
    addItem: ru ? "Добавить пункт" : "Add item", item: ru ? "Новый пункт" : "New item",
    remove: ru ? "Удалить пункт" : "Remove item", edit: ru ? "Изменить пункт" : "Edit item",
    done: ru ? "Готово" : "Done", cancel: ru ? "Отмена" : "Cancel", retry: ru ? "Повторить" : "Retry",
    saveError: ru ? "Не удалось сохранить изменения." : "Could not save changes.",
    reload: ru ? "Обновить данные" : "Reload data", saving: ru ? "Сохранение…" : "Saving…",
    limit: ru ? "До 100 пунктов, не более 500 символов в каждом." : "Up to 100 items, 500 characters each.",
    phases: (ru ? { new: "Новый", in_progress: "В работе", in_review: "На проверке", done: "Завершён", on_hold: "Приостановлен" }
      : { new: "New", in_progress: "In progress", in_review: "In review", done: "Done", on_hold: "On hold" }) satisfies Record<WorkflowPhase, string>,
  };
}
