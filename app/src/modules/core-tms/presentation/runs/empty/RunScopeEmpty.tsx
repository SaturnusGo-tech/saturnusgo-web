import { ListChecks } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import css from "./run-list-empty.module.css";

export function RunScopeEmpty() {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  return <div className={css.body}><div className={css.message}>
    <ListChecks className={css.symbol} size={36} strokeWidth={1.25} aria-hidden="true" />
    <h2>{ru ? "В составе пока нет тестов" : "No tests in this scope yet"}</h2>
    <p>{ru ? "Откройте анализ изменений выше, чтобы проверить предложение и добавить тест-кейсы." : "Open Impact Analysis above to review the proposal and add test cases."}</p>
  </div></div>;
}
