import type { TmsLocale } from "../../../../../localization/model/locale";

const RU_TRANSLATIONS: Record<string, string> = {
  "toolbar.bold": "Жирный",
  "toolbar.removeBold": "Убрать жирный",
  "toolbar.italic": "Курсив",
  "toolbar.removeItalic": "Убрать курсив",
  "toolbar.strikethrough": "Зачёркнутый",
  "toolbar.removeStrikethrough": "Убрать зачёркивание",
  "toolbar.code": "Код",
  "toolbar.removeCode": "Убрать код",
  "toolbar.inlineCode": "Код",
  "toolbar.removeInlineCode": "Убрать код",
  "toolbar.undo": "Отменить",
  "toolbar.redo": "Повторить",
  "toolbar.bulletedList": "Маркированный список",
  "toolbar.numberedList": "Нумерованный список",
  "toolbar.checkList": "Чек-лист",
  "toolbar.toggleGroup": "Списки",
  "toolbar.link": "Добавить ссылку",
  "createLink.urlPlaceholder": "Вставьте адрес ссылки",
  "createLink.text": "Текст ссылки",
  "createLink.textTooltip": "Текст, который будет виден в документе",
  "createLink.title": "Подсказка",
  "createLink.titleTooltip": "Необязательная подсказка при наведении",
  "createLink.saveTooltip": "Сохранить ссылку",
  "createLink.cancelTooltip": "Отменить добавление ссылки",
  "dialogControls.save": "Сохранить",
  "dialogControls.cancel": "Отмена",
};

export function markdownEditorTranslation(
  locale: TmsLocale,
  key: string,
  fallback: string,
  interpolations: Record<string, unknown> = {},
) {
  const template = locale === "ru" ? (RU_TRANSLATIONS[key] ?? fallback) : fallback;
  return Object.entries(interpolations).reduce(
    (value, [name, replacement]) => value.replaceAll(`{{${name}}}`, String(replacement)),
    template,
  );
}
