import type { TmsLocale } from "../model/locale";

const activityLabels: Record<string, readonly [string, string]> = {
  "project.created": ["Project created", "Проект создан"],
  "project.updated": ["Project updated", "Проект обновлён"],
  "project.archived": ["Project archived", "Проект архивирован"],
  "environment.created": ["Environment created", "Среда создана"],
  "environment.updated": ["Environment updated", "Среда обновлена"],
  "environment.archived": ["Environment archived", "Среда архивирована"],
  "test_case.created": ["Test case created", "Тест-кейс создан"],
  "test_case.revised": ["Test case revised", "Ревизия тест-кейса сохранена"],
  "test_case.archived": ["Test case archived", "Тест-кейс архивирован"],
  "test_case.restored": ["Test case restored", "Тест-кейс восстановлен"],
  "test_case.cloned": ["Test case cloned", "Тест-кейс клонирован"],
  "suite.created": ["Suite created", "Сьют создан"],
  "suite.updated": ["Suite updated", "Сьют обновлён"],
  "suite.archived": ["Suite archived", "Сьют архивирован"],
  "run.created": ["Test run created", "Тест-ран создан"],
  "run.active": ["Test run started", "Тест-ран запущен"],
  "run.completed": ["Test run completed", "Тест-ран завершён"],
  "run.aborted": ["Test run aborted", "Тест-ран прерван"],
  "defect.created": ["Defect created", "Дефект создан"],
  "defect.updated": ["Defect updated", "Дефект обновлён"],
  "defect.status_changed": ["Defect status changed", "Статус дефекта изменён"],
};

export const activityLabel = (locale: TmsLocale, action: string) =>
  activityLabels[action]?.[locale === "ru" ? 1 : 0] ?? action.replaceAll(".", " ");
