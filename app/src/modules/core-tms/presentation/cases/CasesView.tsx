import { Archive, Box, ChevronDown, ChevronRight, Clock3, Copy, Filter, Flag, FolderKanban, FolderPlus, MoreHorizontal, PanelRightOpen, Pencil, Play, Plus, RotateCcw, Search, Tag, Wrench } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Activity, TestCaseRevision, TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import { executableSteps } from "../../helpers/cases/caseRevision";
import { formatCount } from "../../localization/format/count";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { CaseFilters } from "../../state/types/workspace";
import { EmptyState } from "../common/empty/EmptyState";
import { SaturnLoader } from "../common/loading/SaturnLoader";
import { CaseInformationInspector } from "./inspector/CaseInformationInspector";
import { TestCaseRepositoryTree } from "./repository/TestCaseRepositoryTree";
import styles from "../../tms.module.css";

type CasesViewProps = {
  query: string; onQuery: (value: string) => void; groups: Array<[string, TestCaseSummary[]]>;
  collapsed: string[]; onToggleFolder: (folder: string) => void; selectedFolder: string;
  onSelectFolder: (folder: string) => void; selectedCaseId: string; onSelectCase: (id: string) => void;
  testCase?: TestCaseSummary; revision: TestCaseRevision | null; linkIds: string[];
  onNew: (folderPath?: string) => void; onEdit: () => void; onClone: () => void;
  onArchive: () => void; onRunCase: () => void; activity: Activity[]; filters: CaseFilters;
  onFilters: (filters: CaseFilters) => void; onNewFolder: () => void; onNewProject: () => void;
  onCollapseAll: () => void; onExpandAll: () => void;
};

function numberedCopy(value: string) {
  const copy = value.trim();
  if (!copy) return [];
  return copy
    .split(/\n+|\s+(?=\d+\.\s)/)
    .map((item) => item.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
}

export function CasesView(props: CasesViewProps) {
  const { locale, languageTag, t } = useTmsLocale();
  const { query, onQuery, groups, collapsed, onToggleFolder, selectedFolder, onSelectFolder, selectedCaseId, onSelectCase, testCase, revision, linkIds, onNew, onEdit, onClone, onArchive, onRunCase, activity, filters, onFilters, onNewFolder, onNewProject, onCollapseAll, onExpandAll } = props;
  const [filterOpen, setFilterOpen] = useState(false);
  const [repositoryMenuOpen, setRepositoryMenuOpen] = useState(false);
  const [caseMenuOpen, setCaseMenuOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [inspectorOverlay, setInspectorOverlay] = useState(false);
  const inspectorCollapseRef = useRef<HTMLButtonElement>(null);
  const inspectorTriggerRef = useRef<HTMLButtonElement>(null);
  const repositoryRef = useRef<HTMLElement>(null);
  const commandBarRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLElement>(null);
  const closeInspector = () => { setInspectorOpen(false); window.requestAnimationFrame(() => inspectorTriggerRef.current?.focus()); };
  const openInspector = () => { setInspectorOpen(true); window.requestAnimationFrame(() => inspectorCollapseRef.current?.focus()); };
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1380px)");
    const sync = () => { setInspectorOverlay(media.matches); setInspectorOpen(!media.matches); };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  useEffect(() => {
    const isolated = inspectorOverlay && inspectorOpen;
    const regions = [repositoryRef.current, commandBarRef.current, documentRef.current];
    regions.forEach((region) => {
      if (!region) return;
      region.inert = isolated;
      if (isolated) region.setAttribute("aria-hidden", "true");
      else region.removeAttribute("aria-hidden");
    });
    return () => regions.forEach((region) => {
      if (!region) return;
      region.inert = false;
      region.removeAttribute("aria-hidden");
    });
  }, [inspectorOpen, inspectorOverlay]);
  useEffect(() => {
    const closeMenus = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (filterOpen || repositoryMenuOpen || caseMenuOpen) {
        setFilterOpen(false); setRepositoryMenuOpen(false); setCaseMenuOpen(false);
      } else if (inspectorOpen) closeInspector();
    };
    const closeOutside = (event: PointerEvent) => { if (!(event.target instanceof Element) || !event.target.closest("[data-case-popover-root]")) { setFilterOpen(false); setRepositoryMenuOpen(false); setCaseMenuOpen(false); } };
    window.addEventListener("keydown", closeMenus);
    window.addEventListener("pointerdown", closeOutside);
    return () => { window.removeEventListener("keydown", closeMenus); window.removeEventListener("pointerdown", closeOutside); };
  }, [caseMenuOpen, filterOpen, inspectorOpen, repositoryMenuOpen]);
  const displayedSteps = revision ? executableSteps(revision, locale) : [];
  const preconditions = numberedCopy(revision?.preconditions ?? "");
  const activeFilterCount = Number(filters.priority !== "all") + Number(filters.lifecycle !== "all") + Number(Boolean(filters.tag.trim())) + Number(filters.includeArchived);
  const breadcrumb = testCase?.folderPath.split("/").filter(Boolean) ?? [];

  return (
    <div className={`${styles.caseWorkbench} ${!inspectorOpen ? styles.caseWorkbenchInspectorClosed : ""}`} data-testid="cases-view">
      <aside ref={repositoryRef} className={`${styles.pane} ${styles.caseRepositoryPane}`}>
        <div className={styles.caseRepositoryHeading}>
          <strong>{t("cases.title")}</strong>
          <button className={styles.repositoryNewButton} onClick={() => onNew(selectedFolder)}><Plus size={15} /> {t("cases.new")}</button>
        </div>
        <div className={styles.caseRepositoryControls} data-case-popover-root>
          <label className={styles.searchField}><Search size={16} /><input aria-label={t("cases.searchAria")} value={query} onChange={(event) => onQuery(event.target.value)} placeholder={t("cases.searchPlaceholder")} /></label>
          <button className={`${styles.iconButton} ${activeFilterCount ? styles.iconButtonActive : ""}`} onClick={() => { setFilterOpen((value) => !value); setRepositoryMenuOpen(false); }} aria-label={t("cases.filter")} aria-expanded={filterOpen} aria-controls="case-filter-popover"><Filter size={16} />{activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button>
          <button className={styles.iconButton} onClick={() => { setRepositoryMenuOpen((value) => !value); setFilterOpen(false); }} aria-label={t("cases.repositoryActions")} aria-expanded={repositoryMenuOpen} aria-controls="case-repository-popover"><MoreHorizontal size={17} /></button>
          {filterOpen && <div id="case-filter-popover" className={styles.toolbarPopover} data-testid="case-filters">
            <div className={styles.popoverHeader}><strong>{t("cases.filterAria")}</strong><button className={styles.textButton} onClick={() => onFilters({ priority: "all", lifecycle: "all", tag: "", includeArchived: false })}>{t("cases.resetFilters")}</button></div>
            <label><span>{t("cases.priority")}</span><select value={filters.priority} onChange={(event) => onFilters({ ...filters, priority: event.target.value as CaseFilters["priority"] })}><option value="all">{t("cases.allPriorities")}</option><option value="critical">{t("priority.critical")}</option><option value="high">{t("priority.high")}</option><option value="medium">{t("priority.medium")}</option><option value="low">{t("priority.low")}</option></select></label>
            <label><span>{t("cases.lifecycle")}</span><select value={filters.lifecycle} onChange={(event) => onFilters({ ...filters, lifecycle: event.target.value as CaseFilters["lifecycle"] })}><option value="all">{t("cases.allStates")}</option><option value="draft">{t("status.draft")}</option><option value="ready">{t("status.ready")}</option><option value="deprecated">{t("status.deprecated")}</option></select></label>
            <label><span>{t("cases.tagContains")}</span><input value={filters.tag} onChange={(event) => onFilters({ ...filters, tag: event.target.value })} placeholder="smoke" /></label>
            <label className={styles.checkboxLine}><input type="checkbox" checked={filters.includeArchived} onChange={(event) => onFilters({ ...filters, includeArchived: event.target.checked })} /><span>{t("cases.includeArchived")}</span></label>
          </div>}
          {repositoryMenuOpen && <div id="case-repository-popover" className={`${styles.toolbarPopover} ${styles.actionMenu}`}>
            <button onClick={() => { onNewFolder(); setRepositoryMenuOpen(false); }}><FolderPlus size={16} /><span><strong>{t("cases.createFolder")}</strong></span></button>
            <button onClick={() => { onNewProject(); setRepositoryMenuOpen(false); }}><FolderKanban size={16} /><span><strong>{t("cases.createProject")}</strong><small>{t("cases.createProjectHint")}</small></span></button>
            <button onClick={() => { onExpandAll(); setRepositoryMenuOpen(false); }}><ChevronDown size={16} /><span><strong>{t("cases.expandAll")}</strong></span></button>
            <button onClick={() => { onCollapseAll(); setRepositoryMenuOpen(false); }}><ChevronRight size={16} /><span><strong>{t("cases.collapseAll")}</strong></span></button>
          </div>}
        </div>
        <TestCaseRepositoryTree {...{ groups, collapsed, selectedFolder, selectedCaseId, onToggleFolder, onSelectFolder, onSelectCase, onNew }} />
      </aside>

      {testCase && revision && <div ref={commandBarRef} className={styles.caseCommandBar}>
        <div className={styles.caseBreadcrumb}>{breadcrumb.map((part) => <span key={part}>{part}</span>)}<strong>{testCase.key}</strong></div>
        <div className={styles.caseCommandActions}>
          <button className={styles.primaryButton} onClick={onRunCase}><Play size={15} /> {t("cases.run")}</button>
          <button className={styles.secondaryButton} onClick={onEdit}><Pencil size={15} /> {t("common.edit")}</button>
          <div className={styles.caseOverflow} data-case-popover-root>
            <button className={styles.iconButton} onClick={() => setCaseMenuOpen((value) => !value)} aria-label={t("common.more")} aria-expanded={caseMenuOpen} aria-controls="case-action-popover"><MoreHorizontal size={17} /></button>
            {caseMenuOpen && <div id="case-action-popover" className={`${styles.toolbarPopover} ${styles.actionMenu} ${styles.caseActionMenu}`}><button onClick={() => { onClone(); setCaseMenuOpen(false); }}><Copy size={16} /><span><strong>{t("cases.clone")}</strong></span></button><button onClick={() => { onArchive(); setCaseMenuOpen(false); }}>{testCase.archivedAt ? <RotateCcw size={16} /> : <Archive size={16} />}<span><strong>{testCase.archivedAt ? t("cases.restore") : t("cases.archive")}</strong></span></button></div>}
          </div>
          {!inspectorOpen && <button ref={inspectorTriggerRef} className={styles.iconButton} onClick={openInspector} aria-label={t("cases.showDetails")} aria-controls="case-inspector" aria-expanded={false}><PanelRightOpen size={17} /></button>}
        </div>
      </div>}

      <section ref={documentRef} className={`${styles.pane} ${styles.caseWorkbenchMain} ${!testCase || !revision ? styles.caseWorkbenchMainEmpty : ""}`}>
        {!testCase ? <EmptyState icon={<FolderKanban size={34} />} title={selectedFolder ? selectedFolder.replace(/^\//, "") : t("cases.select")} text={selectedFolder ? t("cases.emptyFolder") : t("cases.selectHint")} action={<button className={styles.primaryButton} onClick={() => onNew(selectedFolder)}><Plus size={16} /> {t("cases.create")}</button>} /> : !revision ? <SaturnLoader pane label={t("common.loading")} testId="case-detail-loading" /> : <>
          <div className={styles.caseDocumentScroll}>
            <article className={styles.caseDocument}>
              <header className={styles.caseDocumentHeader}>
                <div className={styles.keyLine}>{testCase.key} · {t("cases.revision", { revision: revision.revision })}</div>
                <h1>{revision.title}</h1>
                <p>{revision.description || t("cases.noDescription")}</p>
                <div className={styles.caseTagLine}>
                  {revision.tags.map((tagName) => <span key={tagName}><Tag size={12} />{tagName}</span>)}
                  <span><Flag size={12} />{localizedLabel(locale, revision.priority)}</span>
                  <span><Box size={12} />{revision.component || "—"}</span>
                  <span><Clock3 size={12} />{revision.estimatedMinutes === null ? "—" : `${revision.estimatedMinutes} ${locale === "ru" ? "мин" : "min"}`}</span>
                  <span><Wrench size={12} />{localizedLabel(locale, revision.type)}</span>
                  <span><i className={`${styles.lifecycleDot} ${styles[`dot_${revision.lifecycle}`]}`} aria-hidden="true" />{localizedLabel(locale, revision.lifecycle)}</span>
                </div>
              </header>
              <dl className={styles.casePropertyStrip}>
                <div><dt>{t("common.owner")}</dt><dd>{revision.ownerIdentityId ?? t("common.unassigned")}</dd></div>
                <div><dt>{t("cases.component")}</dt><dd>{revision.component || "—"}</dd></div>
                <div><dt>{t("cases.estimate")}</dt><dd>{revision.estimatedMinutes === null ? "—" : `${revision.estimatedMinutes} ${locale === "ru" ? "мин" : "min"}`}</dd></div>
                <div><dt>{t("cases.type")}</dt><dd>{localizedLabel(locale, revision.type)}</dd></div>
              </dl>
              <div className={styles.caseNarrativeLayout}>
                <section className={styles.caseSection}><h2>{t("cases.preconditions")}</h2>{preconditions.length ? <ol className={styles.casePreconditions}>{preconditions.map((item, index) => <li key={`${index}-${item}`}><span>{index + 1}</span><p>{item}</p></li>)}</ol> : <p>{t("cases.noPreconditions")}</p>}</section>
                <aside className={styles.caseTestData}><h2>{t("cases.testData")}</h2><p>{revision.testData || "—"}</p></aside>
              </div>
              <section className={styles.caseSection}>
                <div className={styles.sectionTitle}><h2>{revision.type === "checklist" ? t("cases.checklist") : t("cases.testSteps")}</h2><span>{revision.type === "checklist" ? formatCount(locale, displayedSteps.length, ["item", "items"], ["пункт", "пункта", "пунктов"]) : formatCount(locale, displayedSteps.length, ["step", "steps"], ["шаг", "шага", "шагов"])}</span></div>
                <table className={styles.caseSteps}><thead><tr><th scope="col">{t("cases.number")}</th><th scope="col">{revision.type === "checklist" ? t("cases.check") : t("cases.action")}</th><th scope="col">{t("cases.expected")}</th></tr></thead><tbody>{displayedSteps.map((step) => <tr key={step.id}><th scope="row">{step.order}</th><td>{step.action}</td><td>{step.expectedResult}</td></tr>)}</tbody></table>
              </section>
            </article>
          </div>
        </>}
      </section>

      {testCase && revision && inspectorOpen && inspectorOverlay && <div className={styles.caseInspectorScrim} aria-hidden="true" onPointerDown={closeInspector} />}
      {testCase && revision && inspectorOpen && <CaseInformationInspector {...{ testCase, revision, activity, linkIds, locale, languageTag, t }} modal={inspectorOverlay} collapseButtonRef={inspectorCollapseRef} collapseLabel={t("cases.hideDetails")} onCollapse={closeInspector} />}
    </div>
  );
}
