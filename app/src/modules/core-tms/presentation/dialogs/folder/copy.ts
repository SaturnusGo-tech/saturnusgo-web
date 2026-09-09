import type { TmsLocale } from "../../../localization/model/locale";

const copies = {
  en: {
    title: "New folder",
    subtitle: "Use folders to mirror features, services, or release areas.",
    name: "Folder name",
    namePlaceholder: "Authentication",
    parent: "Location",
    root: "Repository root",
    searchParent: "Find a folder…",
    noFolders: "No folders found",
    path: "Will be created in",
    duplicate: "This folder already exists",
    cancel: "Cancel",
    create: "Create folder",
  },
  ru: {
    title: "Новая папка",
    subtitle: "Используйте папки для функций, сервисов или областей релиза.",
    name: "Название папки",
    namePlaceholder: "Авторизация",
    parent: "Расположение",
    root: "В репозитории",
    searchParent: "Найти папку…",
    noFolders: "Папки не найдены",
    path: "Папка появится здесь",
    duplicate: "Такая папка уже существует",
    cancel: "Отмена",
    create: "Создать папку",
  },
} as const;

export const getFolderDialogCopy = (locale: TmsLocale) => copies[locale];
