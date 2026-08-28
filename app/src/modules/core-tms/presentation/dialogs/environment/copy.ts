import type { TmsLocale } from "../../../localization/model/locale";

const copies = {
  en: {
    defaultDescription: "Local test target",
    error: "The environment was not saved. Check the key, URL, and TMS API response.",
    title: "New environment",
    subtitle: "Store a reusable target for manual runs.",
    name: "Name",
    key: "Key",
    baseUrl: "Base URL",
    description: "Description",
    cancel: "Cancel",
    creating: "Creating…",
    create: "Create environment",
  },
  ru: {
    defaultDescription: "Локальное тестовое окружение",
    error: "Не удалось сохранить окружение. Проверьте ключ, URL и ответ TMS API.",
    title: "Новое окружение",
    subtitle: "Сохраните переиспользуемую цель для ручных ранов.",
    name: "Название",
    key: "Ключ",
    baseUrl: "Базовый URL",
    description: "Описание",
    cancel: "Отмена",
    creating: "Создание…",
    create: "Создать окружение",
  },
} as const;

export const getEnvironmentDialogCopy = (locale: TmsLocale) => copies[locale];
