import { requestAuthoringLeave } from "../../../authoring/leave/application/authoring-leave";
import { useCaseAuthoringSession } from "./authoring/useCaseAuthoringSession";
import { CaseMaintenanceFeature } from "../../../test-cases/maintenance/composition/CaseMaintenanceFeature";
import { useCaseActivityNavigation } from "../../../test-cases/navigation/activity/useCaseActivityNavigation";
import { ListChecks, Pencil } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { localizedLabel } from "../../../localization/format/labels";
import {
  caseRevisionAttachmentIds, editorSessionClosed, inspectorRevisionProblem,
} from "../inspector/model";
import inspector from "../inspector/caseInspector.module.css";
import { InspectorPendingAttachments } from "../inspector/attachments/InspectorPendingAttachments";
import { CaseAttachmentDraftProvider } from "../inspector/attachments/CaseAttachmentDraftContext";
import { caseMarkdownImages, caseRevisionMarkdown } from "../inspector/attachments/links/caseMarkdownImages";
import type { PendingCaseAttachment, CaseAttachmentProgress } from "../../../application/evidence/case/pendingCaseAttachment";
import { CaseOverview } from "./CaseOverview";
import { CaseDetailDates } from "./header/CaseDetailDates";
import { CaseDetailHeaderActions } from "./header/CaseDetailHeaderActions";
import { CaseContextTab, type DetailTab } from "./tabs/CaseContextTab";
import { CaseDetailTabs } from "./tabs/CaseDetailTabs";
import { useCasePanelExit } from "./motion/useCasePanelExit";
import { useCreateCaseEntrance } from "./motion/create/useCreateCaseEntrance";
import { caseActivityForKey } from "../collaboration/model";
import { readyDefectCount } from "../../../test-cases/collaboration/model/test-case-collaboration";
import styles from "../cases.module.css";
import type { CaseDetailPanelProps } from "./model/case-detail-props";

export type { CaseDetailPanelProps } from "./model/case-detail-props";

export function CaseDetailPanel(props: CaseDetailPanelProps) {
  const [attempted, setAttempted] = useState(false);
  const [tab, setTab] = useState<DetailTab>("overview");
  const [files, setFiles] = useState<PendingCaseAttachment[]>([]);
  const authoring = useCaseAuthoringSession(props.editor, files);
  const [headerEditing, setHeaderEditing] = useState<"title" | null>(null);
  const formId = useId();
  const tabsId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleEditButton = useRef<HTMLButtonElement>(null);
  const headerReturnFocus = useRef<"title" | null>(null);
  const ru = props.locale === "ru";
  const creating = props.editor?.mode === "create";
  useCreateCaseEntrance(panelRef, creating, creating ? undefined : props.testCase?.id);
  const closeWithMotion = useCasePanelExit(panelRef, creating);
  const archived = !creating && Boolean(props.testCase?.archivedAt);
  const editorOpen = Boolean(props.editor);
  const documentationRetry = Boolean(props.editor?.documentationRetry && !creating);
  const uploadLocked = Boolean(props.editor?.submitting || props.editor?.attachmentsPending || documentationRetry);
  const canAttach = !props.readOnly && !archived && props.canAttach !== false;
  const uploadProgress: CaseAttachmentProgress = (id, phase) => setFiles((current) =>
    current.map((entry) => entry.id === id ? { ...entry, phase } : entry));
  const editorWasOpen = useRef(editorOpen);
  const revision = archived ? props.revision : props.editor?.value ?? props.revision;
  const caseId = props.testCase?.id;
  const comments = useMemo(() => props.collaboration.comments.items.filter(comment => comment.caseId === caseId
    && !comment.deletedAt), [props.collaboration.comments.items, caseId]);
  const externalImages = useMemo(() => revision ? caseMarkdownImages([
    ...caseRevisionMarkdown(revision), ...comments.map(comment => comment.body),
  ]) : [], [comments, revision]);
  const readyDefects = creating ? 0 : readyDefectCount(props.collaboration.defects.items);
  useEffect(() => {
    setTab("overview"); setAttempted(false);
    setFiles([]);
    setHeaderEditing(null);
    headerReturnFocus.current = null;
  }, [props.testCase?.id, creating]);
  useCaseActivityNavigation(props.testCase?.projectId, props.testCase?.id, setTab);
  const requiredFields = props.editor?.requiredFields;
  useEffect(() => { if (requiredFields) setTab("overview"); }, [requiredFields]);
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
    if (archived || uploadLocked) return;
    headerReturnFocus.current = section;
    setHeaderEditing(section);
    if (!props.editor) props.onEdit();
  }
  const requestEdit = () => { if (!archived) props.onEdit(); };
  const runCase = () => { if (!archived) props.onRunCase(); };
  function cancelEditor() {
    if (props.editor?.submitting) return;
    void requestAuthoringLeave(commit => closeWithMotion(() => commit(() => { setHeaderEditing(null); props.editor?.onCancel(); })));
  }
  if (!props.testCase && !creating) return <div ref={panelRef} tabIndex={-1} className={styles.detailPanelInner}><div className={styles.detailEmpty}><ListChecks size={28} /><strong>{ru ? "Выберите тест-кейс" : "Select a test case"}</strong><span>{ru ? "Здесь появятся свойства, шаги и история." : "Properties, steps, and history will appear here."}</span><button className={styles.primaryButton} onClick={() => props.onNew(props.selectedFolder)}>{ru ? "Создать кейс" : "Create case"}</button></div></div>;
  if (!revision) return null;
  const editingTitle = !archived && Boolean(props.editor && !documentationRetry && headerEditing === "title");
  const titleLabel = ru ? "Название тест-кейса" : "Test case title";
  const changeTitle = (title: string) => props.editor?.onChange({ ...revision, title });
  const attachmentIds = caseRevisionAttachmentIds(revision, comments);
  const caseActivity = creating ? [] : caseActivityForKey(props.activity, props.testCase?.key);
  const activeTab: DetailTab = creating ? "overview" : tab;
  const problem = props.editor ? inspectorRevisionProblem(revision, props.editor.folderPath) : null;
  const problemMessage = problem === "title" ? (ru ? "Укажите название" : "Add a title")
    : problem === "folder" ? (ru ? "Укажите папку" : "Choose a folder")
    : problem === "tags" ? (ru ? "Теги: до 100 значений из строчных латинских букв, цифр, ., _ или -" : "Tags: up to 100 lowercase values using letters, numbers, ., _, or -")
    : problem === "manualSteps" ? (ru ? "Заполните действие и результат шага" : "Complete each step action and result")
    : problem === "automatedSteps" ? (ru ? "Добавьте хотя бы один шаг автотеста и заполните действие и результат" : "Add at least one automated step and complete its action and result")
    : problem === "checklist" ? (ru ? "Добавьте пункт чек-листа" : "Add a checklist item") : "";
  const editorFeedback = props.editor && <>
    {attempted && problemMessage && <span className={inspector.validationMessage} role="status">{problemMessage}</span>}
    {props.editor.attachmentsPending && !props.editor.submitting && <span className={inspector.validationMessage} role="status">{ru ? "Повторите сохранение, чтобы завершить загрузку файлов." : "Save again to finish uploading the files."}</span>}
    {documentationRetry && !props.editor.submitting && <span className={inspector.validationMessage} role="status">{ru ? "Повторите сохранение, чтобы привязать оставшиеся статьи." : "Save again to link the remaining pages."}</span>}
  </>;
  const cancel = <button type="button" className={creating ? undefined : `${inspector.headerTextButton} ${inspector.headerCancelButton}`} disabled={props.editor?.submitting} onClick={cancelEditor}>{ru ? "Отмена" : "Cancel"}</button>;
  const save = <button type="submit" className={creating ? undefined : `${inspector.headerTextButton} ${inspector.headerRunButton}`} form={formId} disabled={archived || props.editor?.submitting}>{props.editor?.submitting ? (ru ? "Сохранение…" : "Saving…") : creating && !props.editor?.documentation?.retry ? (ru ? "Создать" : "Create") : (ru ? "Сохранить" : "Save")}</button>;
  const editorActions = props.editor && <div id="case-editor-actions" tabIndex={-1} className={creating ? `${inspector.createActions} ${inspector.creationFooter}` : inspector.headerEditActions}>
    {creating ? <>{editorFeedback}{cancel}{save}</> : <>{save}{cancel}</>}
  </div>;
  const headerActions = <CaseDetailHeaderActions
    locale={props.locale} testCase={props.testCase} creating={creating} editorOpen={editorOpen}
    readOnly={props.readOnly} fullscreen={props.fullscreen}
    leadingAction={props.compactHeader?.repositoryAction}
    onRunCase={runCase}
    onToggleFullscreen={props.onToggleFullscreen}
    onClone={props.onClone}
    onCreateDefect={props.onCreateDefect}
    onArchive={props.onArchive}
    onClose={props.onClose ? () => { if (!props.editor?.submitting) props.onClose?.(); } : undefined}
  >{!creating && editorActions}</CaseDetailHeaderActions>;
  const location = props.location && <div className={inspector.caseLocation}>{props.location}</div>;
  const retest = readyDefects > 0 && <div className={inspector.metaRow}>
    <span className={inspector.retestBadge} role="status">{localizedLabel(props.locale, "ready_for_retest")} · {readyDefects}</span>
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
    <header className={`${inspector.caseHeader} ${creating ? inspector.creationHeader : ""}`}
      data-compact={props.compactHeader ? "true" : undefined}>
      {!props.compactHeader && <>{headerActions}{location}{retest}</>}
      <div className={inspector.titleRow}>
        {creating ? <input disabled={uploadLocked} autoFocus data-case-title-input aria-invalid={attempted && problem === "title"}
          aria-label={titleLabel} className={inspector.titleInput} value={revision.title}
          onChange={(event) => changeTitle(event.target.value)} placeholder={titleLabel} /> : <div className={inspector.titleCopy} data-editing={editingTitle}>
          <h2 aria-hidden={editingTitle || undefined}><span className={inspector.titleText}>{revision.title}</span>{props.testCase && <span className={inspector.titleKey}>#{props.testCase.key}</span>}</h2>
          {editingTitle && <textarea disabled={uploadLocked} rows={1} autoFocus data-case-title-input data-inline-title
            aria-invalid={attempted && problem === "title"} aria-label={titleLabel} className={inspector.inlineTitleInput} value={revision.title}
            onChange={(event) => changeTitle(event.target.value.replace(/[\r\n]+/g, " "))}
            onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) event.preventDefault(); }} />}
        </div>}
        {!props.readOnly && !creating && <button ref={titleEditButton} type="button" disabled={archived || uploadLocked || editingTitle}
          className={`${inspector.iconButton} ${inspector.titleEditButton}`} data-hidden={editingTitle} aria-hidden={editingTitle || undefined} onClick={() => beginHeaderEdit("title")}
          aria-label={ru ? "Изменить название" : "Edit title"}><Pencil size={14} /></button>}
        {props.compactHeader && headerActions}
      </div>
      {props.compactHeader && <>{location}{retest}</>}
      {!creating && props.editor && ((attempted && problemMessage) || ((props.editor.attachmentsPending || documentationRetry) && !props.editor.submitting)) &&
        <div className={inspector.headerFeedback}>{editorFeedback}</div>}
      {!creating && <CaseDetailTabs locale={props.locale} active={activeTab} tabsId={tabsId} creating={creating}
        fileCount={attachmentIds.length + externalImages.length} activityCount={caseActivity.length} onActive={setTab}
        actions={props.testCase && <>
          <CaseMaintenanceFeature caseId={props.testCase.id} initial={props.testCase.maintenance} blocked={archived || editorOpen || Boolean(props.readOnly)} />
          <CaseDetailDates locale={props.locale} languageTag={props.languageTag}
            createdAt={props.testCase.createdAt} updatedAt={props.testCase.updatedAt} />
        </>} />}
    </header>
    <CaseAttachmentDraftProvider locale={props.locale} enabled={canAttach && editorOpen} locked={uploadLocked} entries={files} onEntries={setFiles}
      validStepIds={new Set(revision.steps.map(({ id }) => id))} validChecklistIds={new Set(revision.checklist.map(({ id }) => id))}>
    <form id={formId} className={inspector.panelForm} onBeforeInput={(event) => { if (uploadLocked) event.preventDefault(); }} onSubmit={(event) => {
      setAttempted(true);
      if (problem === "title") panelRef.current?.querySelector<HTMLElement>("[data-case-title-input]")?.focus();
      if (archived || !props.editor || problem || props.editor.submitting) { event.preventDefault(); return; }
      setFiles((current) => current.map((entry) => entry.phase === "ready" ? entry : { ...entry, phase: "preparing" }));
      props.editor.onSubmit(event, files, uploadProgress, authoring.release);
    }}>
      <fieldset disabled={uploadLocked} className={inspector.uploadFieldset}>
      <div className={`${styles.detailScroll} ${inspector.scroll}`} id={`${tabsId}-panel`} role={creating ? undefined : "tabpanel"} aria-labelledby={creating ? undefined : `${tabsId}-${activeTab}`} tabIndex={0}>
        {activeTab === "overview" ? <><CaseOverview tagSuggestions={props.tagSuggestions} locale={props.locale} languageTag={props.languageTag} testCaseId={creating ? undefined : props.testCase?.id} projectId={props.testCase?.projectId} revision={revision} archived={archived} readOnly={props.readOnly} editor={archived ? undefined : props.editor} collaboration={props.collaboration} sharedSteps={props.sharedSteps} onResolveSharedStep={props.onResolveSharedStep} onRequestEdit={requestEdit} />{creating && <InspectorPendingAttachments locale={props.locale} showPicker={false} />}</> : <CaseContextTab tab={activeTab} locale={props.locale} languageTag={props.languageTag} testCase={props.testCase} revision={revision}
          attachmentIds={attachmentIds} linkIds={props.linkIds} externalImages={externalImages}
          removableAttachmentIds={canAttach ? new Set(caseRevisionAttachmentIds(revision)) : undefined}
          requestAttachmentEdit={canAttach && !uploadLocked ? requestEdit : undefined}
          activity={caseActivity} collaboration={props.collaboration} onOpenDefect={props.onOpenDefect} onRunCase={runCase} />}
      </div>
      </fieldset>
    </form>
    {creating && editorActions}
    </CaseAttachmentDraftProvider>
  </div>;
}
