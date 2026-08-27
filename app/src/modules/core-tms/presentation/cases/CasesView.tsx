import { Archive, ChevronDown, ChevronRight, Copy, ExternalLink, FilePlus2, Filter, Folder, FolderKanban, FolderPlus, ListChecks, MoreHorizontal, Paperclip, Play, Plus, RotateCcw, Save, Search, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import type { Activity, TestCase, TestCaseRevision, TestRun } from "../../../../core/tms/contracts/legacy-contract";
import { executableSteps, latestRevision } from "../../helpers/cases/caseRevision";
import type { CaseFilters } from "../../state/types/workspace";
import { statusIcon, statusLabel } from "../status/executionStatus";
import { EmptyState } from "../common/empty/EmptyState";
import styles from "../../tms.module.css";
type CasesViewProps = {
  query: string;
  onQuery: (value: string) => void;
  groups: Array<[string, TestCase[]]>;
  collapsed: string[];
  onToggleFolder: (folder: string) => void;
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  selectedCaseId: string;
  onSelectCase: (id: string) => void;
  testCase?: TestCase;
  revision: TestCaseRevision | null;
  onNew: (folderPath?: string) => void;
  onEdit: () => void;
  onClone: () => void;
  onArchive: () => void;
  onRunCase: () => void;
  activity: Activity[];
  runs: TestRun[];
  filters: CaseFilters;
  onFilters: (filters: CaseFilters) => void;
  onNewFolder: () => void;
  onNewProject: () => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
};

export function CasesView(props: CasesViewProps) {
  const { query, onQuery, groups, collapsed, onToggleFolder, selectedFolder, onSelectFolder, selectedCaseId, onSelectCase, testCase, revision, onNew, onEdit, onClone, onArchive, onRunCase, activity, runs, filters, onFilters, onNewFolder, onNewProject, onCollapseAll, onExpandAll } = props;
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
  const caseRuns = testCase ? runs.filter((run) => run.items.some((item) => item.caseId === testCase.id)) : [];
  const displayedSteps = revision ? executableSteps(revision) : [];
  const activeFilterCount = Number(filters.priority !== "all") + Number(filters.lifecycle !== "all") + Number(Boolean(filters.tag.trim())) + Number(filters.includeArchived);
  return (
    <div className={styles.threePane} data-testid="cases-view">
      <aside className={`${styles.pane} ${styles.repositoryPane}`}>
        <div className={styles.repositoryToolbar}>
          <strong className={styles.repositoryLabel}>Cases</strong>
          <button className={styles.toolbarPrimary} onClick={() => onNew(selectedFolder)} aria-label="Create test case" data-testid="new-case"><FilePlus2 size={16} /><span>New case</span></button>
          <button className={styles.iconButton} onClick={onNewFolder} aria-label="Create folder" title="Create folder"><FolderPlus size={17} /></button>
          <button className={`${styles.iconButton} ${activeFilterCount ? styles.iconButtonActive : ""}`} onClick={() => { setFilterOpen((value) => !value); setMoreOpen(false); }} aria-label="Filter" title="Filter"><Filter size={17} />{activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button>
          <button className={styles.iconButton} onClick={() => { setMoreOpen((value) => !value); setFilterOpen(false); }} aria-label="More" title="Repository actions"><MoreHorizontal size={17} /></button>
          {filterOpen && <div className={styles.toolbarPopover} data-testid="case-filters">
            <div className={styles.popoverHeader}><strong>Filter test cases</strong><button className={styles.textButton} onClick={() => onFilters({ priority: "all", lifecycle: "all", tag: "", includeArchived: false })}>Reset</button></div>
            <label><span>Priority</span><select value={filters.priority} onChange={(event) => onFilters({ ...filters, priority: event.target.value as CaseFilters["priority"] })}><option value="all">All priorities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
            <label><span>Lifecycle</span><select value={filters.lifecycle} onChange={(event) => onFilters({ ...filters, lifecycle: event.target.value as CaseFilters["lifecycle"] })}><option value="all">All states</option><option value="draft">Draft</option><option value="ready">Ready</option><option value="deprecated">Deprecated</option><option value="archived">Archived</option></select></label>
            <label><span>Tag contains</span><input value={filters.tag} onChange={(event) => onFilters({ ...filters, tag: event.target.value })} placeholder="smoke" /></label>
            <label className={styles.checkboxLine}><input type="checkbox" checked={filters.includeArchived} onChange={(event) => onFilters({ ...filters, includeArchived: event.target.checked })} /><span>Include archived</span></label>
          </div>}
          {moreOpen && <div className={`${styles.toolbarPopover} ${styles.actionMenu}`}>
            <button onClick={() => { onNewProject(); setMoreOpen(false); }}><FolderKanban size={16} /><span><strong>Create project</strong><small>Start a separate QA repository</small></span></button>
            <button onClick={() => { onExpandAll(); setMoreOpen(false); }}><ChevronDown size={16} /><span><strong>Expand all folders</strong><small>Show every test case</small></span></button>
            <button onClick={() => { onCollapseAll(); setMoreOpen(false); }}><ChevronRight size={16} /><span><strong>Collapse all folders</strong><small>Show repository structure</small></span></button>
          </div>}
        </div>
        <label className={styles.searchField}><Search size={16} /><input aria-label="Search repository test cases" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search test cases" /></label>
        <div className={styles.repositoryTree}>
          {groups.length === 0 && <EmptyState icon={<Search size={25} />} title="Nothing found" text="Try another search or create a case." />}
          {groups.map(([folderName, cases]) => <div className={styles.folderGroup} key={folderName}>
            <div className={`${styles.folderRowWrap} ${selectedFolder === folderName ? styles.folderRowActive : ""}`}>
              <button className={styles.folderToggle} onClick={() => onToggleFolder(folderName)} aria-label={`${collapsed.includes(folderName) ? "Expand" : "Collapse"} ${folderName}`}>{collapsed.includes(folderName) ? <ChevronRight size={15} /> : <ChevronDown size={15} />}</button>
              <button className={styles.folderRow} onClick={() => { onSelectFolder(folderName); if (collapsed.includes(folderName)) onToggleFolder(folderName); }}>
                <Folder size={16} /> <strong>{folderName.replace(/^\//, "")}</strong><small>{cases.length}</small>
              </button>
              <button className={styles.folderAdd} onClick={() => onNew(folderName)} title={`Create test case in ${folderName}`}><Plus size={14} /></button>
            </div>
            {!collapsed.includes(folderName) && cases.map((item) => {
              const value = latestRevision(item);
              return <button key={item.id} className={`${styles.caseRow} ${selectedCaseId === item.id ? styles.caseRowActive : ""}`} onClick={() => onSelectCase(item.id)}>
                <span className={`${styles.lifecycleDot} ${item.archivedAt ? styles.dotArchived : styles[`dot_${value.lifecycle}`]}`} />
                <span><small>{item.key}</small><strong>{value.title}</strong></span>
                {item.archivedAt && <Archive size={13} />}
              </button>;
            })}
            {!collapsed.includes(folderName) && cases.length === 0 && selectedFolder === folderName && <button className={styles.emptyFolderCta} onClick={() => onNew(folderName)}><Plus size={14} /> Add the first test case</button>}
          </div>)}
        </div>
      </aside>

      <section className={`${styles.pane} ${styles.caseDetails}`}>
        {!testCase || !revision ? <EmptyState icon={<FolderKanban size={34} />} title={selectedFolder ? selectedFolder.replace(/^\//, "") : "Select a test case"} text={selectedFolder ? "This folder is ready. Add the first repeatable verification." : "Choose a case from the repository to see its steps and history."} action={<button className={styles.primaryButton} onClick={() => onNew(selectedFolder)}><Plus size={16} /> New test case</button>} /> : <>
          <div className={styles.detailsToolbar}>
            <div className={styles.breadcrumb}><FolderKanban size={15} /><strong>{testCase.key}</strong></div>
            <div className={styles.inlineActions}>
              <button className={styles.primaryButton} onClick={onRunCase}><Play size={15} /> Run case</button>
              <button className={styles.secondaryButton} onClick={onEdit}><Save size={15} /> Edit</button>
              <button className={styles.iconButton} onClick={onClone} title="Clone"><Copy size={16} /></button>
              <button className={styles.iconButton} onClick={onArchive} title={testCase.archivedAt ? "Restore" : "Archive"}>{testCase.archivedAt ? <RotateCcw size={16} /> : <Archive size={16} />}</button>
            </div>
          </div>
          <div className={styles.caseContent}>
            <div className={styles.caseTitleLine}>
              <span className={styles.caseTypeIcon}><ListChecks size={22} /></span>
              <div><div className={styles.keyLine}>{testCase.key} · Revision {revision.revision}</div><h1>{revision.title}</h1></div>
            </div>
            <div className={styles.tagRow}>{revision.tags.map((tagName) => <span key={tagName}><Tag size={12} />{tagName}</span>)}<span className={styles[`priority_${revision.priority}`]}>{revision.priority}</span><span>{revision.lifecycle}</span></div>
            <p className={styles.description}>{revision.description || "No description"}</p>
            <div className={styles.metaGrid}>
              <div><span>Owner</span><strong>{revision.owner}</strong></div><div><span>Component</span><strong>{revision.component}</strong></div>
              <div><span>Estimate</span><strong>{revision.estimatedMinutes ?? "—"} min</strong></div><div><span>Type</span><strong>{revision.type}</strong></div>
            </div>
            <section className={styles.contentSection}><h2>Preconditions</h2><p>{revision.preconditions || "No preconditions specified."}</p></section>
            {revision.testData && <section className={styles.contentSection}><h2>Test data</h2><p>{revision.testData}</p></section>}
            <section className={styles.contentSection}>
              <div className={styles.sectionTitle}><h2>{revision.type === "checklist" ? "Checklist" : "Test steps"}</h2><span>{displayedSteps.length} {revision.type === "checklist" ? displayedSteps.length === 1 ? "item" : "items" : displayedSteps.length === 1 ? "step" : "steps"}</span></div>
              <div className={styles.stepsTable}>
                <div className={styles.stepsHead}><span>#</span><span>{revision.type === "checklist" ? "Check" : "Action"}</span><span>Expected result</span></div>
                {displayedSteps.map((step) => <div className={styles.stepRow} key={step.id}><b>{step.order}</b><p>{step.action}</p><p>{step.expectedResult}</p></div>)}
              </div>
            </section>
            {(revision.attachmentIds.length > 0 || revision.linkIds.length > 0) && <section className={styles.contentSection}><h2>Evidence & links</h2><div className={styles.attachmentGrid}>{revision.attachmentIds.map((name) => <span key={name}><Paperclip size={14} />{name}</span>)}{revision.linkIds.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer"><ExternalLink size={14} />{link}</a>)}</div></section>}
          </div>
        </>}
      </section>

      <aside className={`${styles.pane} ${styles.contextPane}`}>
        <div className={styles.contextTabs}><button className={contextTab === "activity" ? styles.contextTabSelected : ""} onClick={() => setContextTab("activity")}>Activity</button><button className={contextTab === "runs" ? styles.contextTabSelected : ""} onClick={() => setContextTab("runs")}>Runs</button><button className={contextTab === "files" ? styles.contextTabSelected : ""} onClick={() => setContextTab("files")}>Files</button></div>
        <div className={styles.contextBody}>
          {contextTab === "runs" && <><h3>Latest runs</h3>
          {caseRuns.length === 0 ? <div className={styles.miniEmpty}><Play size={20} /><span>Not executed yet</span></div> : caseRuns.slice(0, 6).map((run) => {
            const item = run.items.find((entry) => entry.caseId === testCase?.id);
            return <div className={styles.contextRecord} key={run.id}><span className={`${styles.statusIcon} ${styles[`status_${item?.status ?? "not_run"}`]}`}>{statusIcon[item?.status ?? "not_run"]}</span><div><strong>{run.name}</strong><small>{statusLabel[item?.status ?? "not_run"]} · {run.environment.name}</small></div></div>;
          })}</>}
          {contextTab === "activity" && <><h3>Revision history</h3>{activity.slice(0, 7).map((entry) => <div className={styles.activityLine} key={entry.id}><span>{entry.actor.slice(0, 1).toUpperCase()}</span><div><strong>{entry.action.replaceAll(".", " ")}</strong><small>{new Date(entry.createdAt).toLocaleDateString()}</small></div></div>)}</>}
          {contextTab === "files" && <><h3>Evidence and links</h3>{!revision || (revision.attachmentIds.length === 0 && revision.linkIds.length === 0) ? <div className={styles.miniEmpty}><Paperclip size={20} /><span>No files attached</span></div> : <div className={styles.contextFiles}>{revision.attachmentIds.map((name) => <span key={name}><Paperclip size={14} />{name}</span>)}{revision.linkIds.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer"><ExternalLink size={14} />{link}</a>)}</div>}</>}
        </div>
      </aside>
    </div>
  );
}
