import type { PublicDocLocale } from "./model";

const labels = {
  en: {
    docs: "Docs", home: "Back to Falcon", open: "Open app", search: "Search documentation",
    empty: "No articles found", clear: "Clear search", browse: "Browse documentation", close: "Close navigation",
    onPage: "On this page", next: "Keep exploring", results: "Search results", min: "min read", copy: "Copy code", copied: "Copied",
    introduction: "The Falcon guide", introductionText: "Plan your coverage, run your tests, and keep your team in sync. Start with the essentials, then explore the tools for your workflow.",
  },
  ru: {
    docs: "Документация", home: "На главную Falcon", open: "Открыть Falcon", search: "Поиск по документации",
    empty: "Статьи не найдены", clear: "Очистить поиск", browse: "Разделы документации", close: "Закрыть навигацию",
    onPage: "На этой странице", next: "Читайте дальше", results: "Результаты поиска", min: "мин чтения", copy: "Копировать код", copied: "Скопировано",
    introduction: "Руководство Falcon", introductionText: "Планируйте покрытие, выполняйте проверки и работайте вместе с командой. Начните с основ, затем изучите инструменты для своего рабочего процесса.",
  },
};
export const publicDocLabels = (locale: PublicDocLocale) => labels[locale];
