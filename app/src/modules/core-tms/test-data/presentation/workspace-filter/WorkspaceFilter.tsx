import { Button, Listbox, ListboxItem, PopoverContent, PopoverTrigger } from "@heroui/react";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { AnchoredPopover } from "../../../../../shared/components/anchored-popup/popover/AnchoredPopover";
import { IntegrationSwitch } from "../../../presentation/common/integration-controls/switch/IntegrationSwitch";
import css from "./workspace-filter.module.css";

type Props = { ru: boolean; sort: "name" | "updatedAt"; archived: boolean;
  setSort(sort: "name" | "updatedAt"): void; setArchived(archived: boolean): void };
export function WorkspaceFilter({ ru, sort, archived, setSort, setArchived }: Props) {
  const [open, setOpen] = useState(false), active = archived || sort !== "name";
  return <AnchoredPopover placement="bottom-end" offset={6} isOpen={open} onOpenChange={setOpen} shouldBlockScroll={false} disableAnimation>
    <PopoverTrigger><Button type="button" isIconOnly disableRipple disableAnimation className={css.trigger}
      aria-label={ru ? "Фильтры тестовых данных" : "Test data filters"} aria-expanded={open} data-active={active}>
      <SlidersHorizontal size={15} aria-hidden="true" />
      {active && <span className={css.indicator} aria-hidden="true" />}
    </Button></PopoverTrigger>
    <PopoverContent className={css.menu}>
      <p className={css.heading}>{ru ? "Сортировка" : "Sort by"}</p>
      <Listbox aria-label={ru ? "Сортировка ресурсов" : "Sort resources"} selectionMode="single" disallowEmptySelection
        selectedKeys={[sort]} onSelectionChange={keys => {
          if (keys === "all") return;
          const value = [...keys][0];
          if (value === "name" || value === "updatedAt") setSort(value);
        }} className={css.list} itemClasses={{ base: css.option, title: css.title, selectedIcon: css.selectedIcon }}>
        <ListboxItem key="name">{ru ? "По названию" : "Name A–Z"}</ListboxItem>
        <ListboxItem key="updatedAt">{ru ? "Сначала новые" : "Recently updated"}</ListboxItem>
      </Listbox>
      <div className={css.archive}>
        <IntegrationSwitch size="sm" disableAnimation isSelected={archived} onValueChange={setArchived}
          classNames={{ base: css.archiveSwitch, label: css.title }}>
          {ru ? "Включая архив" : "Include archived"}
        </IntegrationSwitch>
      </div>
    </PopoverContent>
  </AnchoredPopover>;
}
