import type { TmsLocale } from "../../../localization/model/locale";

const copies = {
  en: {
    defaultDescription: "Local test target",
    error: "Could not save the environment. Check the address and use a unique key.",
    title: "New environment",
    editTitle: "Edit environment",
    subtitle: "Set the name and address of your test environment.",
    namePlaceholder: "Staging",
    descriptionPlaceholder: "What is this environment used for?",
    optional: "Optional",
    name: "Name",
    key: "Key",
    baseUrl: "Base URL",
    description: "Description",
    cancel: "Cancel",
    creating: "Saving…",
    create: "Create environment",
    save: "Save changes",
  },
  ru: {
    defaultDescription: "Локальное тестовое окружение",
    error: "Не удалось сохранить окружение. Проверьте адрес и уникальность ключа.",
    title: "Новое окружение",
    editTitle: "Изменить окружение",
    subtitle: "Укажите название и адрес тестового стенда.",
    namePlaceholder: "Тестовый стенд",
    descriptionPlaceholder: "Для каких проверок используется стенд?",
    optional: "Необязательно",
    name: "Название",
    key: "Ключ",
    baseUrl: "Адрес стенда",
    description: "Описание",
    cancel: "Отмена",
    creating: "Сохранение…",
    create: "Создать окружение",
    save: "Сохранить изменения",
  },
} as const;

export const getEnvironmentDialogCopy = (locale: TmsLocale) => copies[locale];
