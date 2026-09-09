export function organizationAttachmentCopy(locale: string) {
  return locale === "ru" ? {
    attach: "Прикрепить файлы", title: "Файлы", afterSave: "Файлы можно прикрепить после создания.",
    loading: "Загрузка файлов…", uploading: "Загружается…", retry: "Повторить", cancel: "Убрать из очереди",
    failed: "Не удалось загрузить файл.", loadError: "Не удалось получить файлы.", more: "Показать ещё", refresh: "Обновить файлы",
    pending: "Файл обрабатывается", unavailable: "Файл недоступен", limit: "За один раз можно выбрать до 20 файлов.",
  } : {
    attach: "Attach files", title: "Files", afterSave: "Files can be attached after creation.",
    loading: "Loading files…", uploading: "Uploading…", retry: "Retry", cancel: "Remove from queue",
    failed: "Could not upload file.", loadError: "Could not load files.", more: "Load more", refresh: "Refresh files",
    pending: "File is processing", unavailable: "File is unavailable", limit: "Select up to 20 files at a time.",
  };
}
