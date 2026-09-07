const guidance: Record<string, [string, string]> = {
  GITHUB_EVENT_BASE_SHA_REQUIRED: [
    "Событие GitHub не содержит корректный базовый коммит. Отправьте новое событие pull request из GitHub.",
    "The GitHub event has no valid base commit. Send a fresh pull request event from GitHub.",
  ],
  INVALID_GITHUB_COMPARISON: [
    "Не удалось подтвердить сравнение коммитов из события GitHub. Отправьте новое событие pull request или выберите тесты вручную.",
    "The comparison could not be verified against the GitHub event commits. Send a fresh pull request event or select tests manually.",
  ],
  CHANGED_PATHS_LIMIT_EXCEEDED: [
    "Не удалось подтвердить полный список изменённых файлов. Для сравнения PR требуется меньше 300 файлов; разделите изменения или выберите тесты вручную.",
    "The complete changed-file list could not be confirmed. PR comparisons require fewer than 300 files; split the change or select tests manually.",
  ],
};

export const connectorFailureLabel = (code: string, ru: boolean) => {
  const text = guidance[code]?.[ru ? 0 : 1];
  return text ? `${code} · ${text}` : code;
};
