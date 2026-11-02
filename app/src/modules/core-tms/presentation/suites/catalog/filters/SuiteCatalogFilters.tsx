import { SettingsSlider } from "@openai/apps-sdk-ui/components/Icon";
import { useCallback, useId, useRef, useState } from "react";
import type { SuiteCatalogFilter, SuiteCatalogSort } from "../../../../suites/catalog/suite-catalog";
import { AnimatedSelect } from "../../../common/select/AnimatedSelect";
import { useAnchoredPopup } from "../../../common/popup/useAnchoredPopup";
import css from "../catalog.module.css";

type Props = {
  ru: boolean; filter: SuiteCatalogFilter; sort: SuiteCatalogSort;
  onFilter: (value: SuiteCatalogFilter) => void; onSort: (value: SuiteCatalogSort) => void;
};
export function SuiteCatalogFilters(props: Props) {
  const [open, setOpen] = useState(false); const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null); const panel = useRef<HTMLDivElement>(null); const id = useId();
  const dismiss = useCallback(() => setOpen(false), []);
  useAnchoredPopup(open, false, root, trigger, panel, dismiss, 250);
  const { ru } = props;
  return <div ref={root} className={css.filter} onKeyDown={event => { if (event.key === "Escape" && open) { event.preventDefault(); event.stopPropagation(); dismiss(); trigger.current?.focus(); } }}>
    <button type="button" ref={trigger} className={css.filterButton} data-active={props.filter !== "all" || props.sort !== "updated" || undefined}
      aria-label={ru ? "Фильтры сьютов" : "Suite filters"} title={ru ? "Фильтры и сортировка" : "Filter and sort"}
      aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)}><SettingsSlider width={19} height={19} /></button>
    {open && <div ref={panel} id={id} popover="manual" role="dialog" aria-label={ru ? "Фильтры сьютов" : "Suite filters"} className={css.filterMenu}>
      <label>{ru ? "Состав" : "Membership"}</label>
      <AnimatedSelect label={ru ? "Состав" : "Membership"} value={props.filter} onChange={value => props.onFilter(value as SuiteCatalogFilter)}
        options={[{ value: "all", label: ru ? "Все сьюты" : "All suites" }, { value: "static", label: ru ? "Вручную" : "Manual" }, { value: "dynamic", label: ru ? "Динамические" : "Dynamic" }]} />
      <label>{ru ? "Сортировка" : "Sort"}</label>
      <AnimatedSelect label={ru ? "Сортировка" : "Sort"} value={props.sort} onChange={value => props.onSort(value as SuiteCatalogSort)}
        options={[{ value: "updated", label: ru ? "Обновлённые" : "Recently updated" }, { value: "name", label: ru ? "По названию" : "Name" }, { value: "created", label: ru ? "Недавно созданные" : "Recently created" }]} />
    </div>}
  </div>;
}
