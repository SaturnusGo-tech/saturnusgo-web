import type { PublicDocLocale } from "./model";

const labels = {
  en: {
    docs: "Docs", home: "Back to Falcon", open: "Open app", search: "Search documentation",
    empty: "No articles found", emptyHint: "Try a different word or browse the topics below.", clear: "Clear search", browse: "Browse documentation", close: "Close navigation",
    onPage: "On this page", next: "Keep exploring", results: "Search results", min: "min read", copy: "Copy code", copyPage: "Copy page", copied: "Copied", theme: "Switch theme",
    introduction: "Falcon Docs", introductionText: "Learn how to plan your coverage, run your tests, and keep your team in sync with Falcon.",
    popular: "Popular", topics: "Explore the documentation", searchHint: "Find an article or explore a topic", escape: "Close search", support: "Contact support", website: "Falcon website", language: "Language", ai: "Sign in to ask Falcon AI",
  },
  ru: {
    docs: "Документация", home: "На главную Falcon", open: "Открыть Falcon", search: "Поиск по документации",
    empty: "Статьи не найдены", emptyHint: "Попробуйте другое слово или выберите раздел ниже.", clear: "Очистить поиск", browse: "Разделы документации", close: "Закрыть навигацию",
    onPage: "На этой странице", next: "Читайте дальше", results: "Результаты поиска", min: "мин чтения", copy: "Копировать код", copyPage: "Копировать страницу", copied: "Скопировано", theme: "Переключить тему",
    introduction: "Falcon Docs", introductionText: "Узнайте, как планировать покрытие, выполнять проверки и работать вместе с командой в Falcon.",
    popular: "Популярное", topics: "Разделы документации", searchHint: "Найдите статью или выберите раздел", escape: "Закрыть поиск", support: "Связаться с поддержкой", website: "Сайт Falcon", language: "Язык", ai: "Войти и спросить Falcon AI",
  },
};
export const publicDocLabels = (locale: PublicDocLocale) => labels[locale];
