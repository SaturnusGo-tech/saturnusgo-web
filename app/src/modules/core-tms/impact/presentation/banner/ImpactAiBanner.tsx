import css from "../styles/impact.module.css";

export function ImpactAiBanner({ ru }: { ru: boolean }) {
  return <aside className={css.aiBanner} role="status" aria-label={ru ? "Доступность AI" : "AI availability"}>
    <div><span className={css.badge}>{ru ? "Опциональная функция" : "Optional feature"}</span>
      <h3>{ru ? "AI-модели временно недоступны" : "AI models are temporarily unavailable"}</h3>
      <p>{ru ? "AI-часть импакт-анализа на паузе. Анализы и ваши решения сохранены; рекомендации по связям кода и ручная проверка остаются доступны."
        : "AI impact analysis is paused. Analyses and your decisions are preserved; code-evidence recommendations and manual review remain available."}</p>
    </div>
    <img src="/falcon/impact/ai-paused-20261018.webp" width="180" height="120" alt="" aria-hidden="true" />
  </aside>;
}
