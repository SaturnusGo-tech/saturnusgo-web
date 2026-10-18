import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useReviewList } from "../../application/review/useReviewList";
import css from "../styles/impact.module.css";

export function ReviewCollection<T>({ items, text, label, ru, children, searchable = true }: {
  items: readonly T[]; text: (item: T) => string; label: string; ru: boolean;
  children: (item: T) => ReactNode; searchable?: boolean;
}) {
  const state = useReviewList(items, text);
  const container = useRef<HTMLDivElement>(null);
  const openPage = (page: number) => {
    state.setPage(page);
    container.current?.scrollIntoView({ block: "start", behavior:
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  if (!items.length) return null;
  return <div className={css.collection} ref={container}>
    <div className={css.reviewToolbar}>
      <span className={css.muted} role="status">{label} · {state.start}–{state.end} / {state.total}</span>
      {searchable && <label className={css.search}><Search size={15} aria-hidden="true" />
        <input type="search" aria-label={`${ru ? "Поиск" : "Search"}: ${label}`} maxLength={300}
          placeholder={ru ? "Найти в списке" : "Search this list"} value={state.query}
          onChange={(event) => state.setQuery(event.target.value)} /></label>}
    </div>
    <ul className={css.list} aria-label={label}>{state.items.map(children)}</ul>
    {!state.total && <p className={css.empty}>{ru ? "Совпадений нет. Измените поисковый запрос." : "No matches. Try a different search."}</p>}
    {state.pages > 1 && <nav className={css.pagination} aria-label={`${ru ? "Страницы" : "Pages"}: ${label}`}>
      <button type="button" disabled={state.page === 1} onClick={() => openPage(state.page - 1)}>
        <ChevronLeft size={15} aria-hidden="true" />{ru ? "Назад" : "Previous"}</button>
      <span className={css.muted}>{ru ? "Страница" : "Page"} {state.page} / {state.pages}</span>
      <button type="button" disabled={state.page === state.pages} onClick={() => openPage(state.page + 1)}>
        {ru ? "Далее" : "Next"}<ChevronRight size={15} aria-hidden="true" /></button>
    </nav>}
  </div>;
}
