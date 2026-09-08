export const settingsSections = ["general", "environments", "exchange", "appearance", "account"] as const;
export type SettingsSection = typeof settingsSections[number];
export const settingsCopy = {
  ru: {
    title: "Настройки", projectGroup: "Проект", personalGroup: "Личные настройки",
    general: ["Общие", "Название, ключ и состояние выбранного проекта."],
    environments: ["Окружения", "Стенды, на которых команда выполняет проверки."],
    exchange: ["Импорт и экспорт", "Переносите тестовую базу между проектами Falcon."],
    appearance: ["Оформление и язык", "Настройте Falcon под привычный способ работы."],
    account: ["Аккаунт и сессия", "Ваш вход в рабочее пространство Falcon."],
    themePreview: "Предпросмотр темы", archiveHint: "Архивный проект сохраняет историю. Его можно восстановить.",
    exportHint: "Скачайте тест-кейсы проекта в формате JSON.",
    importHint: "Выберите файл экспорта Falcon. Перед импортом вы увидите количество кейсов.",
    currentAccount: "Вы вошли как", sessionNote: "Оформление и язык сохраняются для вашего браузера. Выход завершает текущую сессию.",
  },
  en: {
    title: "Settings", projectGroup: "Project", personalGroup: "Personal settings",
    general: ["General", "Name, key and status of the selected project."],
    environments: ["Environments", "The environments your team uses to run tests."],
    exchange: ["Import and export", "Move your test library between Falcon projects."],
    appearance: ["Appearance and language", "Make Falcon fit the way you work."],
    account: ["Account and session", "Your access to the Falcon workspace."],
    themePreview: "Theme preview", archiveHint: "Archived projects retain their history and can be restored.",
    exportHint: "Download this project’s test cases as a JSON file.",
    importHint: "Select a Falcon export. Review the number of cases before importing.",
    currentAccount: "Signed in as", sessionNote: "Appearance and language are saved in this browser. Signing out ends the current session.",
  },
} as const;
