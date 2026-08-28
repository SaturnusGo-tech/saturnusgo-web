import type { TmsLocale } from "../../../localization/model/locale";

const copies = {
  en: {
    title: "Create repository folder",
    subtitle: "Use folders to mirror features, services, or release areas.",
    name: "Folder name",
    namePlaceholder: "Authentication",
    parent: "Parent folder",
    root: "Repository root",
    path: "Folder path",
    duplicate: "This folder already exists",
    cancel: "Cancel",
    create: "Create folder",
  },
  ru: {
    title: "Создать папку репозитория",
    subtitle: "Используйте папки для функций, сервисов или областей релиза.",
    name: "Название папки",
    namePlaceholder: "Авторизация",
    parent: "Родительская папка",
    root: "Корень репозитория",
    path: "Путь к папке",
    duplicate: "Такая папка уже существует",
    cancel: "Отмена",
    create: "Создать папку",
  },
} as const;

export const getFolderDialogCopy = (locale: TmsLocale) => copies[locale];
