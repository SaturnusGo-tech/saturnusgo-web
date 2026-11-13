import { ChevronDown, Folder } from "lucide-react";
import type { SharedStepSummary } from "../../../shared-steps/model/shared-step";
import { sharedStepSections } from "../../../shared-steps/model/catalog/shared-step-catalog";
import { FolderPathBreadcrumb } from "../../common/breadcrumbs/path/FolderPathBreadcrumb";
import { PropertySelect } from "../../common/properties/select/PropertySelect";
import css from "./chooser.module.css";

export function SharedStepSectionFilter({ items, value, ru, onChange }: {
  items: readonly SharedStepSummary[]; value: string; ru: boolean; onChange(value: string): void;
}) {
  const all = ru ? "Все разделы" : "All sections";
  const options = [{ value: "all", label: all }, ...sharedStepSections(items).map(path => ({
    value: path, label: path === "/" ? (ru ? "Корень проекта" : "Project root") : path.split("/").filter(Boolean).join(" › "),
  }))];
  return <div className={css.section}><PropertySelect locale={ru ? "ru" : "en"} label={ru ? "Раздел" : "Section"}
    searchLabel={ru ? "Найти раздел" : "Find a section"} value={value} options={options} onChange={onChange} menuClassName={css.sectionMenu}
    displayValue={<><Folder size={14} aria-hidden="true" /><FolderPathBreadcrumb path={value === "all" ? "/" : value} ru={ru}
      rootLabel={value === "all" ? (ru ? "Весь проект" : "Whole project") : undefined} /><ChevronDown size={12} aria-hidden="true" /></>} /></div>;
}
