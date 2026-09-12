import { SlidersHorizontal } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { SuiteCatalogFilter, SuiteCatalogSort } from "../../../../suites/catalog/suite-catalog";
import { AnimatedSelect } from "../../../common/select/AnimatedSelect";
import css from "../catalog.module.css";

type Props = {
  ru: boolean; filter: SuiteCatalogFilter; sort: SuiteCatalogSort;
  onFilter: (value: SuiteCatalogFilter) => void; onSort: (value: SuiteCatalogSort) => void;
};
export function SuiteCatalogFilters(props: Props) {
  const [open, setOpen] = useState(false); const root = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null); const id = useId();
  const { ru } = props;
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return <div ref={root} className={css.filter} onKeyDown={event => { if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(false); trigger.current?.focus(); } }}>
    <button type="button" ref={trigger} className={css.filterButton} data-active={props.filter !== "all" || undefined} aria-label={ru ? "Фильтры сьютов" : "Suite filters"}
      aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}><SlidersHorizontal size={17} /></button>
    {open && <div id={id} role="group" aria-label={ru ? "Фильтры сьютов" : "Suite filters"} className={css.filterMenu}>
      <label>{ru ? "Состав" : "Membership"}</label>
      <AnimatedSelect label={ru ? "Состав" : "Membership"} value={props.filter} onChange={value => props.onFilter(value as SuiteCatalogFilter)}
        options={[{ value: "all", label: ru ? "Все сьюты" : "All suites" }, { value: "static", label: ru ? "Вручную" : "Manual" }, { value: "dynamic", label: ru ? "По тегам" : "By tags" }]} />
      <label>{ru ? "Сортировка" : "Sort"}</label>
      <AnimatedSelect label={ru ? "Сортировка" : "Sort"} value={props.sort} onChange={value => props.onSort(value as SuiteCatalogSort)}
        options={[{ value: "updated", label: ru ? "Обновлённые" : "Recently updated" }, { value: "name", label: ru ? "По названию" : "Name" }, { value: "created", label: ru ? "Недавно созданные" : "Recently created" }]} />
    </div>}
  </div>;
}
