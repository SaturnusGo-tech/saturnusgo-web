export function welcomeCopy(locale: "ru" | "en") {
  return locale === "ru" ? {
    new: "Новое", trial: "7 дней с Falcon", title: "Начните со своей первой проверки",
    body: "От первого тест-кейса до результатов прогона — всё в одном рабочем пространстве.",
    folders: "Соберите структуру проекта", foldersBody: "Создайте папки для функций и сценариев, которые будете проверять.",
    cases: "Добавьте первый тест-кейс", casesBody: "Опишите шаги и ожидаемый результат. Короткое руководство поможет начать.",
    guide: "Посмотреть руководство", close: "Закрыть приветствие", until: "Доступ до",
    expired: "Пробный период завершён", readonly: "Ваши данные доступны для просмотра и экспорта.",
  } : {
    new: "New", trial: "7 days with Falcon", title: "Start with your first check",
    body: "From your first test case to run results, all in one workspace.",
    folders: "Map out your project", foldersBody: "Create folders for the features and scenarios you want to test.",
    cases: "Write your first test case", casesBody: "Add steps and an expected result. The short guide will help you get started.",
    guide: "Explore the guide", close: "Dismiss welcome", until: "Access until",
    expired: "Your trial has ended", readonly: "Your data is available to view and export.",
  };
}
