import { Archive, ChevronDown, ChevronRight, Copy, ExternalLink, Filter, Folder, FolderKanban, FolderPlus, MoreHorizontal, Paperclip, Play, Plus, RotateCcw, Save, Search, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import type { Activity, TestCaseRevision, TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import { executableSteps } from "../../helpers/cases/caseRevision";
import { activityLabel } from "../../localization/activity/label";
import { formatCount } from "../../localization/format/count";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { CaseFilters } from "../../state/types/workspace";
import { AttachmentLink } from "../../attachments/presentation/link/AttachmentLink";
import { EmptyState } from "../common/empty/EmptyState";
import styles from "../../tms.module.css";
type CasesViewProps = {
  query: string;
  onQuery: (value: string) => void;
  groups: Array<[string, TestCaseSummary[]]>;
  collapsed: string[];
  onToggleFolder: (folder: string) => void;
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  selectedCaseId: string;
  onSelectCase: (id: string) => void;
  testCase?: TestCaseSummary;
  revision: TestCaseRevision | null;
  linkIds: string[];
  onNew: (folderPath?: string) => void;
  onEdit: () => void;
  onClone: () => void;
  onArchive: () => void;
  onRunCase: () => void;
  activity: Activity[];
  filters: CaseFilters;
  onFilters: (filters: CaseFilters) => void;
  onNewFolder: () => void;
  onNewProject: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
};

export function CasesView(props: CasesViewProps) {
  const { locale, languageTag, t } = useTmsLocale();
  const { query, onQuery, groups, collapsed, onToggleFolder, selectedFolder, onSelectFolder, selectedCaseId, onSelectCase, testCase, revision, linkIds, onNew, onEdit, onClone, onArchive, onRunCase, activity, filters, onFilters, onNewFolder, onNewProject, onCollapseAll, onExpandAll } = props;
  const [filterOpen, setFilterOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [contextTab, setContextTab] = useState<"activity" | "runs" | "files">("runs");
  useEffect(() => {
    function closeMenus(event: KeyboardEvent) {
      if (event.key === "Escape") { setFilterOpen(false); setMoreOpen(false); }
    }
    window.addEventListener("keydown", closeMenus);
    return () => window.removeEventListener("keydown", closeMenus);
  }, []);
  const displayedSteps = revision ? executableSteps(revision, locale) : [];
  const activeFilterCount = Number(filters.priority !== "all") + Number(filters.lifecycle !== "all") + Number(Boolean(filters.tag.trim())) + Number(filters.includeArchived);
  return (
    <div className={styles.threePane} data-testid="cases-view">
      <aside className={`${styles.pane} ${styles.repositoryPane}`}>
        <div className={styles.repositoryToolbar}>
          <strong className={styles.repositoryLabel}>{t("cases.title")}</strong>
          <button className={`${styles.iconButton} ${styles.repositoryCreateButton}`} onClick={() => onNew(selectedFolder)} aria-label={t("cases.create")} title={t("cases.new")} data-testid="new-case"><Plus size={17} /></button>
          <button className={styles.iconButton} onClick={onNewFolder} aria-label={t("cases.createFolder")} title={t("cases.createFolder")}><FolderPlus size={17} /></button>
          <button className={`${styles.iconButton} ${activeFilterCount ? styles.iconButtonActive : ""}`} onClick={() => { setFilterOpen((value) => !value); setMoreOpen(false); }} aria-label={t("cases.filter")} title={t("cases.filter")}><Filter size={17} />{activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button>
          <button className={styles.iconButton} onClick={() => { setMoreOpen((value) => !value); setFilterOpen(false); }} aria-label={t("common.more")} title={t("cases.repositoryActions")}><MoreHorizontal size={17} /></button>
          {filterOpen && <div className={styles.toolbarPopover} data-testid="case-filters">
            <div className={styles.popoverHeader}><strong>{t("cases.filterAria")}</strong><button className={styles.textButton} onClick={() => onFilters({ priority: "all", lifecycle: "all", tag: "", includeArchived: false })}>{t("cases.resetFilters")}</button></div>
            <label><span>{t("cases.priority")}</span><select value={filters.priority} onChange={(event) => onFilters({ ...filters, priority: event.target.value as CaseFilters["priority"] })}><option value="all">{t("cases.allPriorities")}</option><option value="critical">{t("priority.critical")}</option><option value="high">{t("priority.high")}</option><option value="medium">{t("priority.medium")}</option><option value="low">{t("priority.low")}</option></select></label>
            <label><span>{t("cases.lifecycle")}</span><select value={filters.lifecycle} onChange={(event) => onFilters({ ...filters, lifecycle: event.target.value as CaseFilters["lifecycle"] })}><option value="all">{t("cases.allStates")}</option><option value="draft">{t("status.draft")}</option><option value="ready">{t("status.ready")}</option><option value="deprecated">{t("status.deprecated")}</option></select></label>
            <label><span>{t("cases.tagContains")}</span><input value={filters.tag} onChange={(event) => onFilters({ ...filters, tag: event.target.value })} placeholder="smoke" /></label>
            <label className={styles.checkboxLine}><input type="checkbox" checked={filters.includeArchived} onChange={(event) => onFilters({ ...filters, includeArchived: event.target.checked })} /><span>{t("cases.includeArchived")}</span></label>
          </div>}
          {moreOpen && <div className={`${styles.toolbarPopover} ${styles.actionMenu}`}>
            <button onClick={() => { onNewProject(); setMoreOpen(false); }}><FolderKanban size={16} /><span><strong>{t("cases.createProject")}</strong><small>{t("cases.createProjectHint")}</small></span></button>
            <button onClick={() => { onExpandAll(); setMoreOpen(false); }}><ChevronDown size={16} /><span><strong>{t("cases.expandAll")}</strong><small>{t("cases.expandAllHint")}</small></span></button>
            <button onClick={() => { onCollapseAll(); setMoreOpen(false); }}><ChevronRight size={16} /><span><strong>{t("cases.collapseAll")}</strong><small>{t("cases.collapseAllHint")}</small></span></button>
          </div>}
        </div>
        <label className={styles.searchField}><Search size={16} /><input aria-label={t("cases.searchAria")} value={query} onChange={(event) => onQuery(event.target.value)} placeholder={t("cases.searchPlaceholder")} /></label>
        <div className={styles.repositoryTree}>
          {groups.length === 0 && <EmptyState icon={<Search size={25} />} title={t("cases.nothingFound")} text={t("cases.nothingFoundHint")} />}
          {groups.map(([folderName, cases]) => <div className={styles.folderGroup} key={folderName}>
            <div className={`${styles.folderRowWrap} ${selectedFolder === folderName ? styles.folderRowActive : ""}`}>
              <button className={styles.folderToggle} onClick={() => onToggleFolder(folderName)} aria-label={`${collapsed.includes(folderName) ? t("cases.expand") : t("cases.collapse")} ${folderName}`}>{collapsed.includes(folderName) ? <ChevronRight size={15} /> : <ChevronDown size={15} />}</button>
              <button className={styles.folderRow} onClick={() => { onSelectFolder(folderName); if (collapsed.includes(folderName)) onToggleFolder(folderName); }}>
                <Folder size={16} /> <strong>{folderName.replace(/^\//, "")}</strong><small>{cases.length}</small>
              </button>
              <button className={styles.folderAdd} onClick={() => onNew(folderName)} title={t("cases.createInFolder", { folder: folderName })}><Plus size={14} /></button>
            </div>
            {!collapsed.includes(folderName) && cases.map((item) => {
              return <button key={item.id} className={`${styles.caseRow} ${selectedCaseId === item.id ? styles.caseRowActive : ""}`} onClick={() => onSelectCase(item.id)}>
                <span className={`${styles.lifecycleDot} ${item.archivedAt ? styles.dotArchived : styles[`dot_${item.lifecycle}`]}`} />
                <span><small>{item.key}</small><strong>{item.title}</strong></span>
                {item.archivedAt && <Archive size={13} />}
              </button>;
            })}
            {!collapsed.includes(folderName) && cases.length === 0 && selectedFolder === folderName && <button className={styles.emptyFolderCta} onClick={() => onNew(folderName)}><Plus size={14} /> {t("cases.addFirst")}</button>}
          </div>)}
        </div>
      </aside>

      <section className={`${styles.pane} ${styles.caseDetails}`}>
        {!testCase || !revision ? <EmptyState icon={<FolderKanban size={34} />} title={selectedFolder ? selectedFolder.replace(/^\//, "") : t("cases.select")} text={selectedFolder ? t("cases.emptyFolder") : t("cases.selectHint")} action={<button className={styles.primaryButton} onClick={() => onNew(selectedFolder)}><Plus size={16} /> {t("cases.create")}</button>} /> : <>
          <div className={styles.detailsToolbar}>
            <div className={styles.breadcrumb}><span>{testCase.folderPath}</span><strong>{testCase.key}</strong></div>
            <div className={styles.inlineActions}>
              <button className={styles.primaryButton} onClick={onRunCase}><Play size={15} /> {t("cases.run")}</button>
              <button className={styles.secondaryButton} onClick={onEdit}><Save size={15} /> {t("common.edit")}</button>
              <button className={styles.iconButton} onClick={onClone} title={t("cases.clone")} aria-label={t("cases.clone")}><Copy size={16} /></button>
              <button className={styles.iconButton} onClick={onArchive} title={testCase.archivedAt ? t("cases.restore") : t("cases.archive")} aria-label={testCase.archivedAt ? t("cases.restore") : t("cases.archive")}>{testCase.archivedAt ? <RotateCcw size={16} /> : <Archive size={16} />}</button>
            </div>
          </div>
          <div className={styles.caseContent}>
            <div className={styles.caseTitleLine}><div><div className={styles.keyLine}>{testCase.key} · {t("cases.revision", { revision: revision.revision })}</div><h1>{revision.title}</h1></div></div>
            <div className={styles.tagRow}>{revision.tags.map((tagName) => <span key={tagName}><Tag size={12} />{tagName}</span>)}<span className={styles[`priority_${revision.priority}`]}>{localizedLabel(locale, revision.priority)}</span><span>{localizedLabel(locale, revision.lifecycle)}</span></div>
            <p className={styles.description}>{revision.description || t("cases.noDescription")}</p>
            <div className={styles.metaGrid}>
              <div><span>{t("common.owner")}</span><strong>{revision.ownerIdentityId ?? t("common.unassigned")}</strong></div><div><span>{t("cases.component")}</span><strong>{revision.component}</strong></div>
              <div><span>{t("cases.estimate")}</span><strong>{revision.estimatedMinutes ?? "—"} {locale === "ru" ? "мин" : "min"}</strong></div><div><span>{t("cases.type")}</span><strong>{localizedLabel(locale, revision.type)}</strong></div>
            </div>
            <div className={styles.caseNarrativeGrid}>
              <section className={styles.contentSection}><h2>{t("cases.preconditions")}</h2><p>{revision.preconditions || t("cases.noPreconditions")}</p></section>
              {revision.testData && <section className={styles.contentSection}><h2>{t("cases.testData")}</h2><p>{revision.testData}</p></section>}
            </div>
            <section className={styles.contentSection}>
              <div className={styles.sectionTitle}><h2>{revision.type === "checklist" ? t("cases.checklist") : t("cases.testSteps")}</h2><span>{revision.type === "checklist" ? formatCount(locale, displayedSteps.length, ["item", "items"], ["пункт", "пункта", "пунктов"]) : formatCount(locale, displayedSteps.length, ["step", "steps"], ["шаг", "шага", "шагов"])}</span></div>
              <div className={styles.stepsTable}>
                <div className={styles.stepsHead}><span>{t("cases.number")}</span><span>{revision.type === "checklist" ? t("cases.check") : t("cases.action")}</span><span>{t("cases.expected")}</span></div>
                {displayedSteps.map((step) => <div className={styles.stepRow} key={step.id}><b>{step.order}</b><p>{step.action}</p><p>{step.expectedResult}</p></div>)}
              </div>
            </section>
            {(revision.attachmentIds.length > 0 || linkIds.length > 0) && <section className={styles.contentSection}><h2>{t("cases.evidenceLinks")}</h2><div className={styles.attachmentGrid}>{revision.attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id} />)}{linkIds.map((id) => <span key={id}><ExternalLink size={14} />{id}</span>)}</div></section>}
          </div>
        </>}
      </section>

      <aside className={`${styles.pane} ${styles.contextPane}`}>
        <div className={styles.contextTabs}><button className={contextTab === "activity" ? styles.contextTabSelected : ""} onClick={() => setContextTab("activity")}>{t("cases.activity")}</button><button className={contextTab === "runs" ? styles.contextTabSelected : ""} onClick={() => setContextTab("runs")}>{t("cases.runs")}</button><button className={contextTab === "files" ? styles.contextTabSelected : ""} onClick={() => setContextTab("files")}>{t("cases.files")}</button></div>
        <div className={styles.contextBody}>
          {contextTab === "runs" && <><h3>{t("cases.latestRuns")}</h3><div className={styles.miniEmpty}><Play size={20} /><span>{t("cases.notExecuted")}</span></div></>}
          {contextTab === "activity" && <><h3>{t("cases.revisionHistory")}</h3>{activity.slice(0, 7).map((entry) => <div className={styles.activityLine} key={entry.id}><span>{entry.actor.slice(0, 1).toUpperCase()}</span><div><strong>{activityLabel(locale, entry.action)}</strong><small>{new Date(entry.createdAt).toLocaleDateString(languageTag)}</small></div></div>)}</>}
          {contextTab === "files" && <><h3>{t("cases.evidenceAndLinks")}</h3>{!revision || (revision.attachmentIds.length === 0 && linkIds.length === 0) ? <div className={styles.miniEmpty}><Paperclip size={20} /><span>{t("cases.noFiles")}</span></div> : <div className={styles.contextFiles}>{revision.attachmentIds.map((id) => <AttachmentLink key={id} attachmentId={id} />)}{linkIds.map((id) => <span key={id}><ExternalLink size={14} />{id}</span>)}</div>}</>}
        </div>
      </aside>
    </div>
  );
}
