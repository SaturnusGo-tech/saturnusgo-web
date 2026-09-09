import type { TmsLocale } from "../../../localization/model/locale";
const copies = {
  en: {
    projectError: "Could not save the project. Check the form and try again.",
    title: "New project", editTitle: "Edit project",
    editHint: "Keep the name and description clear for everyone on the team.",
    createHint: "Give your team’s test repository a name.",
    name: "Project name", namePlaceholder: "Mobile App", key: "Project key", keyPlaceholder: "MOBILE",
    keyHint: "Permanent prefix for test cases and runs.",
    newKeyHint: "Use 2–12 Latin letters or numbers, starting with a letter. Appears in IDs: ",
    description: "Description", optional: "Optional",
    descriptionPlaceholder: "Describe the product and what your team tests here…",
    environmentHint: "You can configure environments and integrations later.",
    cancel: "Cancel", creating: "Creating…", saving: "Saving…", create: "Create project", save: "Save changes",
  },
  ru: {
    projectError: "Не удалось сохранить проект. Проверьте поля формы и повторите попытку.",
    title: "Новый проект", editTitle: "Изменить проект",
    editHint: "Название и описание помогут команде ориентироваться в проектах.",
    createHint: "Назовите проект и укажите, что проверяет команда.",
    name: "Название проекта", namePlaceholder: "Мобильное приложение", key: "Ключ проекта", keyPlaceholder: "MOBILE",
    keyHint: "Постоянный префикс тест-кейсов и прогонов.",
    newKeyHint: "От 2 до 12 латинских букв или цифр, начиная с буквы. Входит в ID: ",
    description: "Описание", optional: "Необязательно",
    descriptionPlaceholder: "Опишите продукт и то, что здесь проверяет команда…",
    environmentHint: "Окружения и интеграции можно настроить позже.",
    cancel: "Отмена", creating: "Создание…", saving: "Сохранение…", create: "Создать проект", save: "Сохранить изменения",
  },
} as const;
export const getProjectDialogCopy = (locale: TmsLocale) => copies[locale];
