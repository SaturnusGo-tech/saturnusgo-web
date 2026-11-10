import { ErrorToast } from "../../../presentation/common/error/ErrorToast";

export function AnalysisAvailability({ code, ru }: { code: string; ru: boolean }) {
  const budget = code === "AI_REQUEST_BUDGET_EXCEEDED";
  const unavailable = ["AI_PROVIDER_UNAVAILABLE", "AI_RATE_LIMITED", "AI_PROVIDER_QUOTA_EXHAUSTED"].includes(code);
  const title = budget ? (ru ? "Достигнут лимит запросов AI" : "AI request limit reached")
    : unavailable ? (ru ? "AI временно недоступен" : "AI is temporarily unavailable")
      : (ru ? "AI-анализ не завершён" : "AI analysis incomplete");
  const message = budget
    ? (ru ? "AI сможет продолжить после сброса лимита. Пока доступны рекомендации по связям кода."
      : "AI can continue after the request limit resets. Code-evidence recommendations are still available.")
    : (ru ? "Проверьте доступные результаты. Для подтверждения состава и запуска прогона нужны все проверки готовности."
      : "Review the available results. All readiness checks must pass before you can approve scope and start a run.");
  return <ErrorToast title={title} message={`${message} · ${code}`} />;
}
