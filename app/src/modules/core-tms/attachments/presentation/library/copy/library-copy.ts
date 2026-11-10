import type { AttachmentLibraryKind } from "../../../domain/library/attachment-library";

const kinds = {
  en: { all: "All", spreadsheet: "Spreadsheets", pdf: "PDFs", image: "Images", video: "Videos", audio: "Audio", archive: "Archives", document: "Documents", other: "Other files" },
  ru: { all: "Все", spreadsheet: "Таблицы", pdf: "PDF", image: "Изображения", video: "Видео", audio: "Аудио", archive: "Архивы", document: "Документы", other: "Другие файлы" },
} satisfies Record<string, Record<AttachmentLibraryKind | "all", string>>;

const sourceNames: Record<string, [string, string]> = {
  test_case_revision: ["Test case", "Тест-кейс"], product_doc: ["Documentation", "Документация"],
  run: ["Test run", "Прогон"], run_attempt: ["Run attempt", "Попытка прогона"],
  defect: ["Bug report", "Баг-репорт"], shared_step_revision: ["Shared step", "Общий шаг"],
  project: ["Project", "Проект"], portfolio: ["Portfolio", "Портфель"], repository_folder: ["Folder", "Папка"],
};

const copy = {
  en: { title: "Attachments", search: "Search", filters: "File type", grid: "Grid view", list: "List view",
    recents: "Recents", name: "Name", source: "Source", date: "Last activity", loading: "Loading attachments",
    empty: "No attachments yet", noMatches: "No matching attachments", failure: "Couldn’t load attachments",
    more: "Show more", favorite: "Add to favorites", unfavorite: "Remove from favorites", downloadError: "Couldn’t download the file",
    suggested: "Suggested", favorites: "Favorites", mine: "Your items", shared: "Shared with you", kinds: kinds.en },
  ru: { title: "Вложения", search: "Поиск", filters: "Тип файла", grid: "Плитка", list: "Список",
    recents: "Недавние", name: "Название", source: "Источник", date: "Последняя активность", loading: "Загрузка вложений",
    empty: "Пока нет вложений", noMatches: "Вложения не найдены", failure: "Не удалось загрузить вложения",
    more: "Показать ещё", favorite: "Добавить в избранное", unfavorite: "Убрать из избранного", downloadError: "Не удалось скачать файл",
    suggested: "Предложенные", favorites: "Избранное", mine: "Мои файлы", shared: "Доступные вам", kinds: kinds.ru },
} as const;

export function attachmentLibraryCopy(locale: "en" | "ru") {
  return { ...copy[locale], sourceName: (kind: string) => sourceNames[kind]?.[locale === "ru" ? 1 : 0] ?? "—" };
}
