import type { TmsLocale } from "../../../localization/model/locale";
const copies = {
  en: {
    projectError: "Check the project key and the TMS API response, then try again.",
    environmentError: "The project was created, but its default environment was not. Retry to resume safely.",
    title: "New project", editTitle: "Edit project",
    editHint: "Keep the name and description clear for everyone on the team.",
    createHint: "Give your team’s test repository a name and connect its first environment.",
    name: "Project name", namePlaceholder: "Mobile App", key: "Project key", keyPlaceholder: "MOBILE",
    keyHint: "Permanent prefix for test cases and runs.",
    newKeyHint: "Use 2–10 Latin letters or numbers. Appears in IDs: ",
    description: "Description", optional: "Optional",
    descriptionPlaceholder: "Describe the product and what your team tests here…",
    environment: "First environment", environmentHint: "You can manage environments separately in Settings.",
    environmentName: "Environment name", baseUrl: "Base URL",
    cancel: "Cancel", creating: "Creating…", saving: "Saving…", create: "Create project", save: "Save changes",
  },
  ru: {
    projectError: "Проверьте ключ проекта и ответ TMS API, затем повторите попытку.",
    environmentError: "Проект создан, но окружение по умолчанию — нет. Повторите, чтобы безопасно продолжить.",
    title: "Новый проект", editTitle: "Изменить проект",
    editHint: "Название и описание помогут команде ориентироваться в проектах.",
    createHint: "Назовите репозиторий тестов команды и подключите первое окружение.",
    name: "Название проекта", namePlaceholder: "Мобильное приложение", key: "Ключ проекта", keyPlaceholder: "MOBILE",
    keyHint: "Постоянный префикс тест-кейсов и прогонов.",
    newKeyHint: "От 2 до 10 латинских букв или цифр. Входит в ID: ",
    description: "Описание", optional: "Необязательно",
    descriptionPlaceholder: "Опишите продукт и то, что здесь проверяет команда…",
    environment: "Первое окружение", environmentHint: "Управлять окружениями можно отдельно в настройках.",
    environmentName: "Название окружения", baseUrl: "Базовый URL",
    cancel: "Отмена", creating: "Создание…", saving: "Сохранение…", create: "Создать проект", save: "Сохранить изменения",
  },
} as const;
export const getProjectDialogCopy = (locale: TmsLocale) => copies[locale];
