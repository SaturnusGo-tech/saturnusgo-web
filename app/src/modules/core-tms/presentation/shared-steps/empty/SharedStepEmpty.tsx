import { Braces, FileCheck2, SearchX } from "lucide-react";
import css from "./empty.module.css";

export function SharedStepEmpty({ searching, ru, onReset }: { searching: boolean; ru: boolean; onReset: () => void }) {
  return <div className={css.empty}>
    {searching ? <SearchX size={30} strokeWidth={1.5} aria-hidden="true" /> : <div className={css.diagram} aria-hidden="true">
      <span className={css.block}><Braces size={19} strokeWidth={1.5} />{ru ? "Общий шаг" : "Shared step"}</span>
      <div className={css.branches}><span><FileCheck2 size={15} strokeWidth={1.5} />{ru ? "Тест-кейс" : "Test case"}</span>
        <span><FileCheck2 size={15} strokeWidth={1.5} />{ru ? "Тест-кейс" : "Test case"}</span></div>
    </div>}
    <h2>{searching ? (ru ? "Общие шаги не найдены" : "No matching shared steps") : (ru ? "Общих шагов пока нет" : "No shared steps yet")}</h2>
    <p>{searching ? (ru ? "Попробуйте другое название или очистите поиск." : "Try another title or clear the search.")
      : (ru ? "Опишите повторяемую процедуру один раз, затем добавляйте её в нужные тест-кейсы." : "Write a reusable procedure once, then add it to the test cases that need it.")}</p>
    {searching && <button type="button" className={css.reset} onClick={onReset}>{ru ? "Очистить поиск" : "Clear search"}</button>}
  </div>;
}
