import { ListChecks } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import css from "./run-list-empty.module.css";

export function RunScopeEmpty({ filtered = false }: { filtered?: boolean }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  return <div className={css.body}><div className={css.message}>
    <ListChecks className={css.symbol} size={36} strokeWidth={1.25} aria-hidden="true" />
    <h2>{filtered ? (ru ? "Нет кейсов по выбранным фильтрам" : "No cases match these filters") : (ru ? "В составе пока нет тестов" : "No tests in this scope yet")}</h2>
    <p>{filtered ? (ru ? "Измените фильтры или поисковый запрос в списке слева." : "Adjust the filters or search in the list on the left.") : (ru ? "Выберите или создайте прогон в списке слева." : "Choose or create a run in the list on the left.")}</p>
  </div></div>;
}
