import { PiListChecks } from "react-icons/pi";
import css from "./browser.module.css";
export function CaseBrowserEmpty({ ru }: { ru: boolean }) {
  return <div className={css.empty} data-testid="case-browser-empty">
    <PiListChecks className={css.emptyIcon} size={44} aria-hidden="true" />
    <h2>{ru ? "Тест-кейс не выбран" : "No test case selected"}</h2>
    <p>{ru ? "Выберите кейс в дереве слева, чтобы посмотреть его шаги и результаты." : "Choose a case in the tree to view its steps and expected results."}</p>
  </div>;
}
