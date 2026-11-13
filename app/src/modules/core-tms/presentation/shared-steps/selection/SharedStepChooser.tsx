import { Listbox, ListboxItem } from "@heroui/react";
import { useState } from "react";
import { Repeat2 } from "lucide-react";
import type { SharedStepSummary } from "../../../shared-steps/model/shared-step";
import { filterSharedSteps } from "../../../shared-steps/model/catalog/shared-step-catalog";
import { FolderPathBreadcrumb } from "../../common/breadcrumbs/path/FolderPathBreadcrumb";
import { PropertySearch } from "../../common/properties/select/PropertySelect";
import { SharedStepSectionFilter } from "./SharedStepSectionFilter";
import css from "./chooser.module.css";

export function SharedStepChooser({ items, ru, onSelect }: {
  items: readonly SharedStepSummary[]; ru: boolean; onSelect(id: string): void;
}) {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");
  const rows = filterSharedSteps(items, query, section);
  return <div className={css.chooser}>
    <PropertySearch label={ru ? "Найти общий шаг или раздел" : "Find a shared step or section"} value={query} onChange={setQuery} />
    <div className={css.filter}><SharedStepSectionFilter items={items} value={section} ru={ru} onChange={setSection} /></div>
    <Listbox aria-label={ru ? "Общие шаги" : "Shared steps"} classNames={{ base: css.list, list: css.options }}
      emptyContent={ru ? "Общие шаги не найдены" : "No shared steps found"}
      itemClasses={{ base: css.option, title: css.title }} onAction={key => onSelect(String(key))}>
      {rows.map(item => <ListboxItem key={item.id} textValue={`${item.title} ${item.folderPath}`}
        startContent={<Repeat2 size={15} aria-hidden="true" />}>
        <strong>{item.title}</strong><FolderPathBreadcrumb path={item.folderPath ?? "/"} ru={ru} />
      </ListboxItem>)}
    </Listbox>
  </div>;
}
