import css from "../styles/impact.module.css";

export function AnalysisAvailability({ code, ru }: { code: string; ru: boolean }) {
  const budget = code === "AI_REQUEST_BUDGET_EXCEEDED";
  const unavailable = ["AI_PROVIDER_UNAVAILABLE", "AI_RATE_LIMITED", "AI_PROVIDER_QUOTA_EXHAUSTED"].includes(code);
  return <div className={`${budget || unavailable ? css.notice : css.error} ${css.availability}`} role={budget || unavailable ? "status" : "alert"}>
    <strong>{budget ? (ru ? "Достигнут лимит запросов AI" : "AI request limit reached")
      : unavailable ? (ru ? "AI временно недоступен" : "AI is temporarily unavailable")
        : (ru ? "AI-анализ не завершён" : "AI analysis incomplete")}</strong>
    <p>{budget ? (ru ? "AI сможет продолжить после сброса лимита. Доступные рекомендации по связям кода можно проверить ниже; они не заменяют полный AI-анализ."
      : "AI can continue after the request limit resets. Available code-evidence recommendations can be reviewed below; they do not replace the full AI analysis.")
      : (ru ? "Проверьте доступные результаты ниже. Подтверждать состав и запускать прогон можно только после выполнения всех проверок готовности."
        : "Review available results below. Scope approval and run execution still require all readiness checks to pass.")}</p>
    <details><summary>{ru ? "Техническая информация" : "Technical details"}</summary><code className={css.code}>{code}</code></details>
  </div>;
}
