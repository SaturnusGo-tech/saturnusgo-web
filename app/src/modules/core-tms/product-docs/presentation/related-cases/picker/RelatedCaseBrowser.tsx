import { Button } from "@heroui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { RepositoryQueryControls } from "../../../../presentation/cases/browser/controls/RepositoryQueryControls";
import { useSelectionFilters } from "../../../../presentation/cases/selection/controls/SelectionControls";
import { PickerRows } from "../../../../presentation/dialogs/suite/picker/rows/PickerRows";
import { pickerSelection } from "../../../../presentation/dialogs/suite/picker/model/picker-model";
import { SuiteFolderPath } from "../../../../presentation/suites/shared/folder-path/SuiteFolderPath";
import { fieldFilterCount } from "../../../../presentation/cases/model/fields/case-field-filters";
import { relatedCaseView } from "./model/related-case-view";
import { RelatedCaseFolders } from "./tree/RelatedCaseFolders";
import shared from "../../../../presentation/dialogs/suite/picker/suite-picker.module.css";
import css from "./related-case-browser.module.css";

type Props = {
  cases: TestCaseSummary[]; folders: RepositoryFolder[]; selected: ReadonlySet<string>;
  projectName: string; ru: boolean; disabled: boolean; onToggle(id: string): void; onScope(ids: readonly string[]): void;
};

export function RelatedCaseBrowser({ cases, folders, selected, projectName, ru, disabled, onToggle, onScope }: Props) {
  const state = useSelectionFilters(cases);
  const [filterOpen, setFilterOpen] = useState(false), [folder, setFolder] = useState("");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const checkbox = useRef<HTMLInputElement>(null), mobileFolders = useRef<HTMLDetailsElement>(null);
  const reduced = useReducedMotion();
  const restricted = Boolean(state.query.trim() || state.qlQuery.trim() || state.filters.tag || state.filters.type !== "all"
    || state.filters.priority !== "all" || state.filters.lifecycle !== "all" || state.filters.maintenanceStatus && state.filters.maintenanceStatus !== "all"
    || state.filters.includeArchived || fieldFilterCount(state.facets) || state.facets.folders.length || state.facets.components.length || state.facets.owners?.length);
  const view = useMemo(() => relatedCaseView({ folders, cases: state.visible, folder, selected,
    selectedOnly: selectedOnly && selected.size > 0, prune: restricted, includeArchived: state.filters.includeArchived }),
  [folders, state.visible, folder, selected, selectedOnly, restricted, state.filters.includeArchived]);
  const selection = pickerSelection(view.visible, selected);
  useEffect(() => { if (checkbox.current) checkbox.current.indeterminate = selection.partial; }, [selection.partial]);
  useEffect(() => { if (!selected.size) setSelectedOnly(false); }, [selected.size]);
  function chooseFolder(id: string) { setFolder(id); if (mobileFolders.current) mobileFolders.current.open = false; }
  const navigation = <RelatedCaseFolders folders={view.folders} count={view.total} current={view.current?.id ?? ""}
    projectName={projectName} ru={ru} disabled={disabled} onChoose={chooseFolder} />;
  const selectedAction = <span className={css.selectedReveal} data-open={selected.size > 0 || undefined} aria-hidden={!selected.size}
    ref={element => { if (element) element.inert = !selected.size; }}>
    <Button type="button" size="sm" variant="flat" disableRipple isDisabled={disabled || !selected.size}
      className={css.selectedButton} aria-pressed={selectedOnly && selected.size > 0} onPress={() => setSelectedOnly(value => !value)}>
      {ru ? "Выбрано" : "Selected"}<span>{selected.size}</span>
    </Button>
  </span>;
  return <section className={`${shared.picker} ${css.picker}`} data-purpose="related-cases" aria-label={ru ? "Выбор тест-кейсов" : "Choose test cases"}>
    <div className={css.controls}><RepositoryQueryControls locale={ru ? "ru" : "en"} query={state.query} onQuery={state.setQuery}
      qlQuery={state.qlQuery} onQlQuery={state.setQlQuery} filters={state.filters} onFilters={state.setFilters}
      facets={state.facets} onFacets={state.setFacets} options={state.options} tags={state.options.tags} directory={state.directory}
      filterOpen={filterOpen} onFilterOpen={setFilterOpen} onResetExtra={() => setSelectedOnly(false)} disabled={disabled} actions={selectedAction} /></div>
    <details ref={mobileFolders} className={shared.mobileFolders}><summary>
      <span>{view.current ? <SuiteFolderPath path={view.current.path} folderId={view.current.id} appearance={view.current.appearance} ru={ru} />
        : ru ? "Все кейсы" : "All cases"}</span><ChevronDown size={14} aria-hidden="true" /></summary>{navigation}</details>
    <div className={shared.browser}>
      <aside className={shared.folders}>{navigation}</aside>
      <div className={shared.results}>
        <div className={shared.scopeBar}><label className={shared.selectVisible}>
          <input ref={checkbox} type="checkbox" checked={selection.all} disabled={disabled || !view.visible.length}
            aria-label={ru ? "Выбрать видимые кейсы" : "Select visible cases"} onChange={() => onScope(selection.ids)} />
          <span>{ru ? "Выбрать видимые" : "Select visible"}</span>
        </label><span className={shared.resultCount} role="status">{view.visible.length} {ru ? "кейсов" : "cases"}</span></div>
        <AnimatePresence initial={false} mode="wait"><motion.div key={view.visible.map(item => item.id).join(",")}
          className={css.results} initial={{ opacity: 0, y: reduced ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : .18, ease: [.22, .61, .36, 1] }}>
          {view.visible.length ? <PickerRows cases={view.visible} selected={selected} ru={ru} showMetadata={false} onToggle={onToggle} />
            : <div className={shared.empty}><Search size={24} aria-hidden="true" />
              <strong>{cases.length ? (ru ? "Кейсы не найдены" : "No matching cases") : (ru ? "Здесь пока нет кейсов" : "No cases here yet")}</strong>
              <p>{cases.length ? (ru ? "Измените поиск, фильтры или папку." : "Change the search, filters, or folder.")
                : (ru ? "Добавьте тест-кейсы в проект, чтобы связать их с этой статьёй." : "Add test cases to the project to link them to this article.")}</p>
            </div>}
        </motion.div></AnimatePresence>
      </div>
    </div>
  </section>;
}
