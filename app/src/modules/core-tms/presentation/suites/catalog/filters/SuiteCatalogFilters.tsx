import { AnchoredPopover as Popover } from "../../../../../../shared/components/anchored-popup/popover/AnchoredPopover";
import { Button, PopoverContent, PopoverTrigger, Radio, RadioGroup } from "@heroui/react";
import { SettingsSlider } from "@openai/apps-sdk-ui/components/Icon";
import type { SuiteCatalogFilter, SuiteCatalogSort } from "../../../../suites/catalog/suite-catalog";
import css from "../catalog.module.css";

type Props = {
  ru: boolean; filter: SuiteCatalogFilter; sort: SuiteCatalogSort;
  onFilter: (value: SuiteCatalogFilter) => void; onSort: (value: SuiteCatalogSort) => void;
};

export function SuiteCatalogFilters({ ru, filter, sort, onFilter, onSort }: Props) {
  const label = ru ? "Фильтры сьютов" : "Suite filters";
  const membership: [SuiteCatalogFilter, string][] = [
    ["all", ru ? "Все сьюты" : "All suites"], ["static", ru ? "Вручную" : "Manual"],
    ["dynamic", ru ? "По правилам" : "Automatic"],
  ];
  const order: [SuiteCatalogSort, string][] = [
    ["updated", ru ? "Обновлённые" : "Recently updated"], ["name", ru ? "По названию" : "Name"],
    ["created", ru ? "Недавно созданные" : "Recently created"],
  ];
  const radio = { base: css.filterOption, label: css.filterLabel, labelWrapper: css.filterLabelWrapper,
    wrapper: css.filterCircle, control: css.filterDot, hiddenInput: css.filterInput };
  return <Popover placement="bottom-end" offset={6} shouldBlockScroll={false}
    classNames={{ base: css.filterPositioner, content: css.filterMenu }}>
    <PopoverTrigger>
      <Button type="button" isIconOnly variant="light" disableRipple className={css.filterButton}
        data-active={filter !== "all" || sort !== "updated" || undefined} aria-label={label}>
        <SettingsSlider width={17} height={17} aria-hidden="true" />
      </Button>
    </PopoverTrigger>
    <PopoverContent aria-label={label}>
      <RadioGroup label={ru ? "Состав" : "Membership"} value={filter} classNames={{ label: css.filterSection, wrapper: css.filterChoices }}
        onValueChange={value => onFilter(value as SuiteCatalogFilter)}>
        {membership.map(([value, text]) => <Radio key={value} value={value} size="sm" classNames={radio}>{text}</Radio>)}
      </RadioGroup>
      <RadioGroup label={ru ? "Сортировка" : "Sort"} value={sort} classNames={{ label: css.filterSection, wrapper: css.filterChoices }}
        onValueChange={value => onSort(value as SuiteCatalogSort)}>
        {order.map(([value, text]) => <Radio key={value} value={value} size="sm" classNames={radio}>{text}</Radio>)}
      </RadioGroup>
    </PopoverContent>
  </Popover>;
}
