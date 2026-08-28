import type { TmsLocale } from "../../../localization/model/locale";

const copies = {
  en: {
    defaultName: "Release quality",
    defaultDescription: "Release readiness and manual test results",
    error: "The dashboard was not created. Check the TMS API and retry.",
    title: "Create dashboard",
    subtitle: "Start with a useful quality overview.",
    name: "Name",
    description: "Description",
    widgets: "Starter widgets included",
    widgetsHint: "Run progress, pass rate, open defects, and recent activity.",
    cancel: "Cancel",
    creating: "Creating…",
    create: "Create dashboard",
  },
  ru: {
    defaultName: "Качество релиза",
    defaultDescription: "Готовность релиза и результаты ручного тестирования",
    error: "Не удалось создать дашборд. Проверьте TMS API и повторите попытку.",
    title: "Создать дашборд",
    subtitle: "Начните с полезного обзора качества.",
    name: "Название",
    description: "Описание",
    widgets: "Стартовые виджеты включены",
    widgetsHint: "Прогресс ранов, процент прохождения, открытые дефекты и последние действия.",
    cancel: "Отмена",
    creating: "Создание…",
    create: "Создать дашборд",
  },
} as const;

export const getDashboardDialogCopy = (locale: TmsLocale) => copies[locale];
