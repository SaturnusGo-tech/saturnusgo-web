import { FolderVisual } from "../../../../folders/presentation/appearance/visual/FolderVisual";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "@openai/apps-sdk-ui/components/Icon";
import type { TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { filterPickerCases, pickerFolders, pickerSelection, type PickerPriority } from "./model/picker-model";
import { SuiteFolderPath } from "../../../suites/shared/folder-path/SuiteFolderPath";
import { PickerFolders } from "./folders/PickerFolders";
import { PickerRows } from "./rows/PickerRows";
import { PriorityFilter } from "./controls/PriorityFilter";
import styles from "./suite-picker.module.css";

export type SuiteCasePickerProps = {
  cases: readonly TestCaseSummary[]; folders: readonly RepositoryFolder[]; selected: ReadonlySet<string>;
  projectName: string; ru: boolean; readonly?: boolean; onToggle: (id: string) => void; onScope: (ids: readonly string[]) => void;
  purpose?: "suite" | "related-cases";
};

export function SuiteCasePicker({ cases, folders, selected, projectName, ru, readonly: readOnly, purpose = "suite", onToggle, onScope }: SuiteCasePickerProps) {
  const [query, setQuery] = useState(""), [folder, setFolder] = useState(""), [priority, setPriority] = useState<PickerPriority>("all");
  const [selectedOnly, setSelectedOnly] = useState(false);
  const checkbox = useRef<HTMLInputElement>(null), mobileFolders = useRef<HTMLDetailsElement>(null), searchId = useId();
  const active = useMemo(() => cases.filter(item => !item.archivedAt), [cases]);
  const entries = useMemo(() => pickerFolders(folders, active), [folders, active]);
  const currentFolder = entries.find(entry => entry.id === folder);
  const scope = currentFolder ? folder : "";
  const visible = useMemo(() => filterPickerCases(active, entries, { folder: scope, query, priority,
    selected: selectedOnly && !readOnly ? selected : undefined }), [active, entries, scope, query, priority, selectedOnly, readOnly, selected]);
  const selection = pickerSelection(visible, selected);
  useEffect(() => { if (checkbox.current) checkbox.current.indeterminate = selection.partial; }, [selection.partial]);
  const folderName = currentFolder ? <SuiteFolderPath path={currentFolder.path} folderId={currentFolder.id} appearance={currentFolder.appearance} ru={ru} /> : (ru ? "Все кейсы" : "All cases");
  const folderTitle = currentFolder?.path ?? (ru ? "Все кейсы" : "All cases");
  const chooseFolder = (id: string) => { setFolder(id); if (mobileFolders.current) mobileFolders.current.open = false; };
  const navigation = <PickerFolders folders={entries} count={active.length} current={scope} projectName={projectName} ru={ru} onChoose={chooseFolder} />;
  const filtered = Boolean(query || scope || priority !== "all" || (selectedOnly && !readOnly));
  return <section className={styles.picker} data-purpose={purpose} aria-label={ru ? "Выбор тест-кейсов" : "Choose test cases"}>
    <div className={styles.toolbar}>
      <div className={styles.search} data-input-shell><Search width={17} height={17} aria-hidden="true" />
        <label className={styles.srOnly} htmlFor={searchId}>{ru ? "Найти тест-кейс" : "Find a test case"}</label>
        <input id={searchId} type="search" placeholder={ru ? "Найти тест-кейс" : "Find a test case"} value={query}
          onChange={event => setQuery(event.target.value)} autoComplete="off" />
        {query && <button type="button" aria-label={ru ? "Очистить поиск" : "Clear search"} onClick={() => setQuery("")}><X width={14} height={14} /></button>}
      </div>
      <PriorityFilter value={priority} ru={ru} onChange={setPriority} />
      {!readOnly && <button type="button" className={styles.selectedFilter} aria-pressed={selectedOnly} onClick={() => setSelectedOnly(value => !value)}>
        {ru ? "Выбрано" : "Selected"}<span>{selected.size}</span>
      </button>}
    </div>
    <details ref={mobileFolders} className={styles.mobileFolders}><summary>{!currentFolder && <FolderVisual />}
      <span>{folderName}</span><ChevronDown width={14} height={14} aria-hidden="true" /></summary>{navigation}</details>
    <div className={styles.browser}>
      <aside className={styles.folders}>{navigation}</aside>
      <div className={styles.results}>
        <div className={styles.scopeBar}>
          {readOnly ? <span className={styles.scopeName} title={folderTitle}>{folderName}</span>
            : <label className={styles.selectVisible}><input ref={checkbox} type="checkbox" checked={selection.all} disabled={!visible.length}
              aria-label={ru ? "Выбрать видимые кейсы" : "Select visible cases"} onChange={() => onScope(selection.ids)} />
              <span>{ru ? "Выбрать видимые" : "Select visible"}</span></label>}
          <span className={styles.resultCount} role="status">{visible.length} {ru ? "кейсов" : "cases"}</span>
        </div>
        {visible.length ? <PickerRows cases={visible} selected={selected} ru={ru} readonly={readOnly} onToggle={onToggle} />
          : <div className={styles.empty}><Search width={24} height={24} aria-hidden="true" />
            <strong>{active.length ? (ru ? "Кейсы не найдены" : "No matching cases") : (ru ? "Здесь пока нет кейсов" : "No cases here yet")}</strong>
            <p>{active.length ? (ru ? "Попробуйте другой запрос, приоритет или папку." : "Try another search, priority, or folder.")
              : purpose === "related-cases" ? (ru ? "Добавьте тест-кейсы в проект, чтобы связать их с этой статьёй." : "Add test cases to the project to link them to this article.")
                : (ru ? "Добавьте тест-кейсы в проект, чтобы включить их в набор." : "Add test cases to the project to include them in a suite.")}</p>
            {filtered && <button type="button" onClick={() => { setQuery(""); setPriority("all"); setFolder(""); setSelectedOnly(false); }}>
              {ru ? "Сбросить фильтры" : "Clear filters"}</button>}
          </div>}
      </div>
    </div>
  </section>;
}
