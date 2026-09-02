import { ListChecks, Pencil } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Activity, TestCaseRevision, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../../localization/model/locale";
import { editorSessionClosed, inspectorRevisionProblem, type CaseInspectorEditor } from "../inspector/model";
import inspector from "../inspector/caseInspector.module.css";
import { InspectorPendingAttachments } from "../inspector/attachments/InspectorPendingAttachments";
import { CaseAttachmentDraftProvider } from "../inspector/attachments/CaseAttachmentDraftContext";
import type { PendingCaseAttachment } from "../../../application/evidence/case/pendingCaseAttachment";
import { CaseOverview } from "./CaseOverview";
import { CaseDetailHeaderActions } from "./header/CaseDetailHeaderActions";
import { CaseContextTab, type DetailTab } from "./tabs/CaseContextTab";
import { CaseDetailTabs } from "./tabs/CaseDetailTabs";
import type { CaseCollaborationViewModel } from "../collaboration/model";
import { readyDefectCount } from "../../../test-cases/collaboration/model/test-case-collaboration";
import styles from "../cases.module.css";

export type CaseDetailPanelProps = {
  locale: TmsLocale;
  languageTag: string;
  testCase?: TestCaseSummary;
  revision: TestCaseRevision | null;
  linkIds: string[];
  activity: Activity[];
  collaboration: CaseCollaborationViewModel;
  onOpenDefect: (defectId: string) => void;
  selectedFolder: string;
  editor?: CaseInspectorEditor;
  onNew: (folder?: string) => void;
  onEdit: () => void;
  onClone: () => void;
  onArchive: () => void;
  onRunCase: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose?: () => void;
};

export function CaseDetailPanel(props: CaseDetailPanelProps) {
  const [tab, setTab] = useState<DetailTab>("overview");
  const [files, setFiles] = useState<PendingCaseAttachment[]>([]);
  const [headerEditing, setHeaderEditing] = useState<"title" | null>(null);
  const formId = useId();
  const tabsId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleEditButton = useRef<HTMLButtonElement>(null);
  const headerReturnFocus = useRef<"title" | null>(null);
  const ru = props.locale === "ru";
  const creating = props.editor?.mode === "create";
  const editorOpen = Boolean(props.editor);
  const editorWasOpen = useRef(editorOpen);
  const revision = props.editor?.value ?? props.revision;
  const readyDefects = creating ? 0 : readyDefectCount(props.collaboration.defects.items);
  useEffect(() => {
    setTab("overview");
    setFiles([]);
    setHeaderEditing(null);
    headerReturnFocus.current = null;
  }, [props.testCase?.id, creating]);
  useEffect(() => {
    const closed = editorSessionClosed(editorWasOpen.current, editorOpen);
    editorWasOpen.current = editorOpen;
    if (!closed) return;
    setFiles([]);
    setHeaderEditing(null);
    const returnTarget = headerReturnFocus.current;
    headerReturnFocus.current = null;
    const frame = requestAnimationFrame(() => {
      const trigger = returnTarget === "title" ? titleEditButton.current : null;
      (trigger ?? panelRef.current)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [editorOpen]);

  function beginHeaderEdit(section: "title") {
    headerReturnFocus.current = section;
    setHeaderEditing(section);
    if (!props.editor) props.onEdit();
  }

  function cancelEditor() {
    if (props.editor?.submitting) return;
    setHeaderEditing(null);
    props.editor?.onCancel();
  }

  if (!props.testCase && !creating) return <div ref={panelRef} tabIndex={-1} className={styles.detailPanelInner}><div className={styles.detailEmpty}><ListChecks size={28} /><strong>{ru ? "Выберите тест-кейс" : "Select a test case"}</strong><span>{ru ? "Здесь появятся свойства, шаги и история." : "Properties, steps, and history will appear here."}</span><button className={styles.primaryButton} onClick={() => props.onNew(props.selectedFolder)}>{ru ? "Создать кейс" : "Create case"}</button></div></div>;
  if (!revision) return null;
  const activeTab: DetailTab = creating ? "overview" : tab;
  const problem = props.editor ? inspectorRevisionProblem(revision, props.editor.folderPath) : null;
  const problemMessage = problem === "title" ? (ru ? "Укажите название" : "Add a title")
    : problem === "folder" ? (ru ? "Укажите папку" : "Choose a folder")
    : problem === "tags" ? (ru ? "Теги: до 100 значений из строчных латинских букв, цифр, ., _ или -" : "Tags: up to 100 lowercase values using letters, numbers, ., _, or -")
    : problem === "manualSteps" ? (ru ? "Заполните действие и результат шага" : "Complete each step action and result")
    : problem === "automatedSteps" ? (ru ? "Добавьте хотя бы один шаг автотеста и заполните действие и результат" : "Add at least one automated step and complete its action and result")
    : problem === "checklist" ? (ru ? "Добавьте пункт чек-листа" : "Add a checklist item") : "";
  const editorActions = props.editor && <div id="case-editor-actions" tabIndex={-1} className={`${inspector.createActions} ${creating ? inspector.creationFooter : ""}`}>
    {problemMessage && <span className={inspector.validationMessage} role="status">{problemMessage}</span>}
    <button type="button" disabled={props.editor.submitting} onClick={cancelEditor}>{ru ? "Отмена" : "Cancel"}</button>
    <button type="submit" form={formId} disabled={props.editor.submitting || Boolean(problem)}>{props.editor.submitting ? (ru ? "Сохранение…" : "Saving…") : creating ? (ru ? "Создать" : "Create") : (ru ? "Сохранить" : "Save")}</button>
  </div>;

  return <div
    ref={panelRef}
    data-case-inspector-overlay-root
    tabIndex={-1}
    className={`${styles.detailPanelInner} ${inspector.shell} ${creating ? inspector.creatingShell : ""}`}
    onKeyDown={(event) => {
      if (event.key !== "Escape" || !props.editor || event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      cancelEditor();
    }}
  >
    <header className={`${inspector.caseHeader} ${creating ? inspector.creationHeader : ""}`}>
      <CaseDetailHeaderActions
        locale={props.locale}
        testCase={props.testCase}
        creating={creating}
        editorOpen={editorOpen}
        fullscreen={props.fullscreen}
        onRunCase={props.onRunCase}
        onToggleFullscreen={props.onToggleFullscreen}
        onClone={props.onClone}
        onArchive={props.onArchive}
        onClose={props.onClose}
      />
      {readyDefects > 0 && <div className={inspector.metaRow}>
        {readyDefects > 0 && <span className={inspector.retestBadge} role="status">{ru ? "Готово к тестированию" : "Ready for testing"} · {readyDefects}</span>}
      </div>}
      <div className={inspector.titleRow}>
        {creating && <span className={inspector.createTitleLabel}>{ru ? "Название тест-кейса" : "Test case title"}<b aria-hidden="true"> *</b></span>}
        {props.editor && (creating || headerEditing === "title") ? <input autoFocus={creating || headerEditing === "title"} aria-label={ru ? "Название тест-кейса" : "Test case title"} className={inspector.titleInput} value={revision.title} onChange={(event) => props.editor?.onChange({ ...revision, title: event.target.value })} placeholder={ru ? "Название тест-кейса" : "Test case title"} /> : <h2>{revision.title}</h2>}
        {!creating && headerEditing !== "title" && <button ref={titleEditButton} type="button" disabled={props.editor?.submitting} className={inspector.iconButton} onClick={() => beginHeaderEdit("title")} aria-label={ru ? "Изменить название" : "Edit title"}><Pencil size={14} /></button>}
      </div>
      {!creating && editorActions}
      {!creating && <CaseDetailTabs locale={props.locale} active={activeTab} tabsId={tabsId} creating={creating} onActive={setTab} />}
    </header>
    <CaseAttachmentDraftProvider locale={props.locale} enabled={Boolean(props.editor)} entries={files} onEntries={setFiles} validStepIds={new Set(revision.steps.map(({ id }) => id))}>
    <form id={formId} className={inspector.panelForm} onSubmit={(event) => { if (!props.editor || problem) event.preventDefault(); else props.editor.onSubmit(event, files); }}>
      <div className={`${styles.detailScroll} ${inspector.scroll}`} id={`${tabsId}-panel`} role={creating ? undefined : "tabpanel"} aria-labelledby={creating ? undefined : `${tabsId}-${activeTab}`} tabIndex={0}>
        {activeTab === "overview" ? <><CaseOverview locale={props.locale} languageTag={props.languageTag} testCaseId={creating ? undefined : props.testCase?.id} revision={revision} archived={Boolean(props.testCase?.archivedAt)} editor={props.editor} collaboration={props.collaboration} onRequestEdit={props.onEdit} />{creating && <InspectorPendingAttachments locale={props.locale} />}</> : <CaseContextTab tab={activeTab} locale={props.locale} languageTag={props.languageTag} testCase={props.testCase} revision={revision} linkIds={props.linkIds} activity={props.activity} collaboration={props.collaboration} onOpenDefect={props.onOpenDefect} onRunCase={props.onRunCase} />}
      </div>
    </form>
    {creating && editorActions}
    </CaseAttachmentDraftProvider>
  </div>;
}
