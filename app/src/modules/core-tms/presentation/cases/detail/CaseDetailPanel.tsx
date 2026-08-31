import {
  Archive, Check, Copy, Link2, ListChecks, Maximize2,
  Minimize2, Pencil, Play, RotateCcw, X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type {
  Activity,
  TestCaseRevision,
  TestCaseSummary,
} from "../../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../../localization/model/locale";
import { buildCaseDeepLink } from "../../../test-cases/navigation/case-deep-link";
import {
  editorSessionClosed,
  inspectorRevisionProblem,
  type CaseInspectorEditor,
} from "../inspector/model";
import inspector from "../inspector/caseInspector.module.css";
import { InspectorPendingAttachments } from "../inspector/attachments/InspectorPendingAttachments";
import { CaseOverview } from "./CaseOverview";
import { CaseMetadataControls } from "./metadata/CaseMetadataControls";
import {
  CaseContextTab,
  type DetailTab,
  type InspectorComment,
} from "./tabs/CaseContextTab";
import { CaseDetailTabs } from "./tabs/CaseDetailTabs";
import styles from "../cases.module.css";

export type CaseDetailPanelProps = {
  locale: TmsLocale;
  languageTag: string;
  testCase?: TestCaseSummary;
  revision: TestCaseRevision | null;
  linkIds: string[];
  activity: Activity[];
  comments?: InspectorComment[];
  onAddComment?: (body: string) => void | Promise<void>;
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
  const [linkCopied, setLinkCopied] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [headerEditing, setHeaderEditing] = useState<"meta" | "title" | null>(null);
  const formId = useId();
  const tabsId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const metaEditButton = useRef<HTMLButtonElement>(null);
  const titleEditButton = useRef<HTMLButtonElement>(null);
  const headerReturnFocus = useRef<"meta" | "title" | null>(null);
  const ru = props.locale === "ru";
  const creating = props.editor?.mode === "create";
  const editorOpen = Boolean(props.editor);
  const editorWasOpen = useRef(editorOpen);
  const revision = props.editor?.value ?? props.revision;
  useEffect(() => {
    setTab("overview");
    setLinkCopied(false);
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
      const trigger = returnTarget === "meta" ? metaEditButton.current
        : returnTarget === "title" ? titleEditButton.current : null;
      (trigger ?? panelRef.current)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [editorOpen]);

  function beginHeaderEdit(section: "meta" | "title") {
    headerReturnFocus.current = section;
    setHeaderEditing(section);
    if (!props.editor) props.onEdit();
  }

  function cancelEditor() {
    if (props.editor?.submitting) return;
    setHeaderEditing(null);
    props.editor?.onCancel();
  }

  async function copyLink() {
    if (!props.testCase) return;
    const link = buildCaseDeepLink(window.location.href, {
      caseId: props.testCase.id,
      projectId: props.testCase.projectId,
    });
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(link);
    } catch {
      const field = document.createElement("textarea");
      field.value = link;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1800);
  }

  if (!props.testCase && !creating) return <div ref={panelRef} tabIndex={-1} className={styles.detailPanelInner}><div className={styles.detailEmpty}><ListChecks size={28} /><strong>{ru ? "Выберите тест-кейс" : "Select a test case"}</strong><span>{ru ? "Здесь появятся свойства, шаги и история." : "Properties, steps, and history will appear here."}</span><button className={styles.primaryButton} onClick={() => props.onNew(props.selectedFolder)}>{ru ? "Создать кейс" : "Create case"}</button></div></div>;
  if (!revision) return null;
  const activeTab: DetailTab = creating ? "overview" : tab;
  const problem = props.editor
    ? inspectorRevisionProblem(revision, props.editor.folderPath) : null;
  const problemMessage = problem === "title" ? (ru ? "Укажите название" : "Add a title")
    : problem === "folder" ? (ru ? "Укажите папку" : "Choose a folder")
    : problem === "manualSteps" ? (ru ? "Заполните действие и результат шага" : "Complete each step action and result")
    : problem === "checklist" ? (ru ? "Добавьте пункт чек-листа" : "Add a checklist item") : "";
  const keyLabel = creating
    ? (ru ? "Новый тест-кейс" : "New test case")
    : `${props.testCase?.key} · ${props.testCase?.folderPath}`;

  return <div
    ref={panelRef}
    tabIndex={-1}
    className={`${styles.detailPanelInner} ${inspector.shell}`}
    onKeyDown={(event) => {
      if (event.key !== "Escape" || !props.editor || event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      cancelEditor();
    }}
  >
    <header className={inspector.caseHeader}>
      <div className={inspector.utilityRow}>
        <span className={inspector.caseKey}>{keyLabel}</span>
        <div className={inspector.headerActions}>
          {!creating && <button type="button" disabled={editorOpen} className={inspector.iconButton} onClick={props.onRunCase} aria-label={ru ? "Запустить кейс" : "Run case"}><Play size={14} /></button>}
          {!creating && <button type="button" className={inspector.iconButton} onClick={copyLink} aria-label={linkCopied ? (ru ? "Ссылка скопирована" : "Link copied") : (ru ? "Копировать ссылку" : "Copy link")}>{linkCopied ? <Check size={14} /> : <Link2 size={14} />}</button>}
          <button type="button" className={inspector.iconButton} onClick={props.onToggleFullscreen} aria-label={props.fullscreen ? (ru ? "Выйти из полного экрана" : "Exit full screen") : (ru ? "На весь экран" : "Open full screen")} aria-pressed={props.fullscreen}>{props.fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}</button>
          {!creating && <button type="button" disabled={editorOpen} className={inspector.iconButton} onClick={props.onClone} aria-label={ru ? "Клонировать" : "Clone"}><Copy size={14} /></button>}
          {!creating && <button type="button" disabled={editorOpen} className={inspector.iconButton} onClick={props.onArchive} aria-label={props.testCase?.archivedAt ? (ru ? "Восстановить" : "Restore") : (ru ? "Архивировать" : "Archive")}>{props.testCase?.archivedAt ? <RotateCcw size={14} /> : <Archive size={14} />}</button>}
          {props.onClose && <button type="button" className={inspector.iconButton} onClick={props.onClose} aria-label={ru ? "Закрыть" : "Close"}><X size={15} /></button>}
        </div>
      </div>
      <div className={inspector.metaRow}>
        <CaseMetadataControls
          locale={props.locale}
          revision={revision}
          archived={Boolean(props.testCase?.archivedAt)}
          editing={Boolean(props.editor && (creating || headerEditing === "meta"))}
          autoFocus={headerEditing === "meta"}
          onChange={props.editor?.onChange}
        />
        {!creating && headerEditing !== "meta" && <button ref={metaEditButton} type="button" disabled={props.editor?.submitting} className={inspector.iconButton} onClick={() => beginHeaderEdit("meta")} aria-label={ru ? "Изменить статус, приоритет, тип и оценку" : "Edit status, priority, type, and estimate"}><Pencil size={13} /></button>}
      </div>
      <div className={inspector.titleRow}>
        <span className={inspector.titleMark}><ListChecks size={17} /></span>
        {props.editor && (creating || headerEditing === "title") ? <input autoFocus={creating || headerEditing === "title"} aria-label={ru ? "Название тест-кейса" : "Test case title"} className={inspector.titleInput} value={revision.title} onChange={(event) => props.editor?.onChange({ ...revision, title: event.target.value })} placeholder={ru ? "Название тест-кейса" : "Test case title"} /> : <h2>{revision.title}</h2>}
        {!creating && headerEditing !== "title" && <button ref={titleEditButton} type="button" disabled={props.editor?.submitting} className={inspector.iconButton} onClick={() => beginHeaderEdit("title")} aria-label={ru ? "Изменить название" : "Edit title"}><Pencil size={14} /></button>}
      </div>
      {props.editor && <div id="case-editor-actions" tabIndex={-1} className={inspector.createActions}>
        {problemMessage && <span className={inspector.validationMessage} role="status">{problemMessage}</span>}
        <button type="button" disabled={props.editor.submitting} onClick={cancelEditor}>{ru ? "Отмена" : "Cancel"}</button>
        <button type="submit" form={formId} disabled={props.editor.submitting || Boolean(problem)}>{props.editor.submitting ? (ru ? "Сохранение…" : "Saving…") : creating ? (ru ? "Создать" : "Create") : (ru ? "Сохранить" : "Save")}</button>
      </div>}
      <CaseDetailTabs locale={props.locale} active={activeTab} tabsId={tabsId} creating={creating} onActive={setTab} />
    </header>
    <form id={formId} className={inspector.panelForm} onSubmit={(event) => { if (!props.editor || problem) event.preventDefault(); else props.editor.onSubmit(event, files); }}>
      <div className={`${styles.detailScroll} ${inspector.scroll}`} id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${activeTab}`} tabIndex={0}>
        {activeTab === "overview" ? <><CaseOverview locale={props.locale} revision={revision} editor={props.editor} onRequestEdit={props.onEdit} />{creating && <InspectorPendingAttachments locale={props.locale} files={files} onFiles={setFiles} />}</> : <CaseContextTab tab={activeTab} locale={props.locale} languageTag={props.languageTag} testCase={props.testCase} revision={revision} linkIds={props.linkIds} activity={props.activity} comments={props.comments} onAddComment={props.onAddComment} pendingFiles={files} onPendingFiles={props.editor ? setFiles : undefined} />}
      </div>
    </form>
    <span className={styles.visuallyHidden} role="status" aria-live="polite">{linkCopied ? (ru ? "Ссылка на тест-кейс скопирована" : "Test case link copied") : ""}</span>
  </div>;
}
