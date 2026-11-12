export function importFailureMessage(failure: unknown, locale: "ru" | "en"): string {
  const code = typeof failure === "object" && failure && "code" in failure ? String(failure.code) : "";
  if (!code.startsWith("IMPORT_")) return failure instanceof Error ? failure.message : "Import failed.";
  if (code === "IMPORT_SOURCE_INVALID") return locale === "ru"
    ? "В файле не найдены тест-кейсы. Проверьте содержимое файла."
    : "No test cases were found in the file. Check the file contents.";
  if (code === "IMPORT_LIMIT_EXCEEDED") return locale === "ru"
    ? "Файл превышает лимит обработки. Разделите его на несколько файлов."
    : "The file exceeds the processing limit. Split it into smaller files.";
  const sourceErrors: Record<string, [string, string]> = {
    IMPORT_UNSAFE_NUMBER: ["Числовое значение потеряет точность. Сохраните длинные идентификаторы и точные числа как текст.", "A number would lose precision. Export long identifiers and precise values as text."],
    IMPORT_INVALID_PROVIDER: ["Проверьте связи и обязательные поля в экспорте исходного сервиса.", "Check relationships and required fields in the provider export."],
    IMPORT_INCOMPLETE_PROVIDER: ["Экспорт неполный: загрузите все страницы и связанные записи.", "The export is incomplete. Include every page and related record."],
    IMPORT_DUPLICATE_JSON_KEYS: ["В JSON повторяется имя поля. Устраните неоднозначность перед импортом.", "The JSON contains duplicate field names. Resolve them before importing."],
    IMPORT_NO_RECORDS: ["В файле нет записей для импорта.", "There are no records to import."],
    IMPORT_UNSUPPORTED_FORMAT: ["Выберите JSON, CSV, TSV, XML, XLSX или XLS.", "Choose a JSON, CSV, TSV, XML, XLSX or XLS file."],
    IMPORT_INVALID_UTF8: ["Сохраните текстовый файл в кодировке UTF-8.", "Save the text file using UTF-8 encoding."],
    IMPORT_INVALID_JSON: ["Файл содержит некорректный JSON.", "The file contains invalid JSON."],
    IMPORT_INVALID_CSV: ["Проверьте разделители, кавычки и количество колонок в CSV.", "Check CSV delimiters, quotes and column counts."],
    IMPORT_INVALID_XML: ["Файл содержит некорректный XML.", "The file contains invalid XML."],
    IMPORT_UNSAFE_XML: ["XML с DTD или объявлениями сущностей не поддерживается.", "XML with DTD or entity declarations is not supported."],
    IMPORT_XML_MIXED_CONTENT: ["Этот XML содержит неоднозначную структуру текста. Используйте JSON или CSV.", "This XML has ambiguous mixed text. Use JSON or CSV."],
    IMPORT_INVALID_WORKBOOK: ["Не удалось прочитать таблицу. Проверьте файл и его формат.", "The workbook could not be read. Check the file and format."],
    IMPORT_INVALID_COLUMNS: ["В таблице есть некорректные колонки или строки.", "The table contains invalid columns or rows."],
    IMPORT_AMBIGUOUS_COLUMNS: ["Несколько колонок задают одно поле. Уточните названия колонок.", "Multiple columns define the same field. Make the column names unambiguous."],
  };
  const sourceMessage = sourceErrors[code];
  if (sourceMessage) return sourceMessage[locale === "ru" ? 0 : 1];
  return locale === "ru" ? "Не удалось обработать файл. Повторите импорт; выбранный файл сохранён."
    : "Could not process this file. Retry the import; your file is retained.";
}
