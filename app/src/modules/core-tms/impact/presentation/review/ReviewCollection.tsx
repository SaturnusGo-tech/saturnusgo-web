import { IntegrationButton } from "../../../presentation/common/integration-controls/button/IntegrationButton";
import { IntegrationInput } from "../../../presentation/common/integration-controls/input/IntegrationInput";
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
      {searchable && <IntegrationInput className={css.search} startContent={<Search size={15} aria-hidden="true" />}
        type="search" aria-label={`${ru ? "Поиск" : "Search"}: ${label}`} maxLength={300}
          placeholder={ru ? "Найти в списке" : "Search this list"} value={state.query}
          onValueChange={state.setQuery} />}
    </div>
    <ul className={css.list} aria-label={label}>{state.items.map(children)}</ul>
    {!state.total && <p className={css.empty}>{ru ? "Совпадений нет. Измените поисковый запрос." : "No matches. Try a different search."}</p>}
    {state.pages > 1 && <nav className={css.pagination} aria-label={`${ru ? "Страницы" : "Pages"}: ${label}`}>
      <IntegrationButton type="button" isDisabled={state.page === 1} onPress={() => openPage(state.page - 1)}>
        <ChevronLeft size={15} aria-hidden="true" />{ru ? "Назад" : "Previous"}</IntegrationButton>
      <span className={css.muted}>{ru ? "Страница" : "Page"} {state.page} / {state.pages}</span>
      <IntegrationButton type="button" isDisabled={state.page === state.pages} onPress={() => openPage(state.page + 1)}>
        {ru ? "Далее" : "Next"}<ChevronRight size={15} aria-hidden="true" /></IntegrationButton>
    </nav>}
  </div>;
}
