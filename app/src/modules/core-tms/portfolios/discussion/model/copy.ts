import type { TmsLocale } from "../../../localization/model/locale";

export const discussionCopy = (locale: TmsLocale) => locale === "ru" ? {
  title: "Обсуждение", placeholder: "Добавьте комментарий, вопрос или результат проверки…", label: "Комментарий",
  send: "Отправить", sending: "Отправка…", empty: "Обсуждение пока не началось", hint: "Здесь можно обсудить планы и результаты работы.",
  more: "Предыдущие комментарии", refresh: "Обновить обсуждение", loading: "Загрузка обсуждения…", retry: "Повторить",
  loadError: "Не удалось загрузить обсуждение.", sendError: "Не удалось отправить комментарий.", sent: "Комментарий добавлен",
} : {
  title: "Discussion", placeholder: "Add a comment, question or testing result…", label: "Comment",
  send: "Send", sending: "Sending…", empty: "No discussion yet", hint: "Discuss plans and results here.",
  more: "Earlier comments", refresh: "Refresh discussion", loading: "Loading discussion…", retry: "Retry",
  loadError: "Could not load the discussion.", sendError: "Could not send the comment.", sent: "Comment added",
};
