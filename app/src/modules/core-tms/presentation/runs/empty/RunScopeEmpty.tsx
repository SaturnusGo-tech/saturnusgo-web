import { ListChecks, Plus } from "lucide-react";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import css from "./run-list-empty.module.css";

export function RunScopeEmpty({ filtered = false, noRun = false, onCreate }: { filtered?: boolean; noRun?: boolean; onCreate?: () => void }) {
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  return <div className={css.body}><div className={css.message}>
    <ListChecks className={css.symbol} size={36} strokeWidth={1.25} aria-hidden="true" />
    <h2>{noRun ? (ru ? "Нет текущих прогонов" : "No current runs") : filtered ? (ru ? "Нет кейсов по выбранным фильтрам" : "No cases match these filters") : (ru ? "В составе пока нет тестов" : "No tests in this scope yet")}</h2>
    <p>{noRun ? (ru ? "Создайте новый прогон. Завершённые доступны в меню «Архивные раны»." : "Create a new run. Finished runs are available under Archived runs.") : filtered ? (ru ? "Измените фильтры или поисковый запрос в списке слева." : "Adjust the filters or search in the list on the left.") : (ru ? "Выберите или создайте прогон в списке слева." : "Choose or create a run in the list on the left.")}</p>
    {noRun && onCreate && <button type="button" className={css.create} onClick={onCreate}><Plus size={16}/>{ru ? "Новый прогон" : "New run"}</button>}
  </div></div>;
}
