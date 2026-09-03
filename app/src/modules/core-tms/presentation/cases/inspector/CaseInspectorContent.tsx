import { useEffect, useRef, useState } from "react";
import type { TestCaseRevision } from "../../../../../core/tms/contracts/legacy-contract";
import { localizedComponentLabel } from "../../../localization/format/labels";
import type { TmsLocale } from "../../../localization/model/locale";
import { CaseMetadataControls } from "../detail/metadata/CaseMetadataControls";
import { InspectorDetails } from "./details/InspectorDetails";
import { useCaseAttachmentDraft } from "./attachments/CaseAttachmentDraftContext";
import { CaseCreationSections } from "./creation/CaseCreationSections";
import { MarkdownField } from "./markdown/MarkdownField";
import { InspectorSectionView } from "./section/InspectorSectionView";
import { InspectorSteps } from "./steps/InspectorSteps";
import type { CaseInspectorEditor, InspectorSection } from "./model";
import { copyInspectorRevision, isInspectorSectionEditing, restoreInspectorSection } from "./model";
import css from "./caseInspector.module.css";
import type { SharedStep, SharedStepSummary } from "../../../shared-steps/model/shared-step";
type Props = {
  locale: TmsLocale; revision: TestCaseRevision; archived?: boolean; editor?: CaseInspectorEditor;
  sharedSteps: readonly SharedStepSummary[];
  onResolveSharedStep: (id: string) => Promise<SharedStep | null>;
  onRequestEdit: () => void;
};
export function CaseInspectorContent({
  locale, revision, archived, editor, sharedSteps, onResolveSharedStep, onRequestEdit,
}: Props) {
  const ru = locale === "ru";
  const attachmentDraft = useCaseAttachmentDraft();
  const [visible, setVisible] = useState(() => copyInspectorRevision(revision));
  const [editing, setEditing] = useState<ReadonlySet<InspectorSection>>(() => new Set());
  const snapshots = useRef<Partial<Record<InspectorSection, TestCaseRevision>>>({});
  const folderSnapshots = useRef<Partial<Record<InspectorSection, string>>>({});
  const value = editor?.value ?? visible;
  const editorMode = editor?.mode;
  const creating = editorMode === "create";
  useEffect(() => { setVisible(copyInspectorRevision(revision)); }, [revision]);
  useEffect(() => {
    if (editor) return;
    setEditing(new Set());
    snapshots.current = {};
    folderSnapshots.current = {};
  }, [editor]);
  function begin(section: InspectorSection) {
    if (snapshots.current[section]) return;
    snapshots.current[section] = copyInspectorRevision(value);
    folderSnapshots.current[section] = editor?.folderPath ?? "";
    setEditing((current) => new Set(current).add(section));
    if (!editor) onRequestEdit();
  }
  function patch(next: Partial<TestCaseRevision>) {
    if (editor) editor.onChange({ ...editor.value, ...next });
  }
  function cancel(section: InspectorSection) {
    const snapshot = snapshots.current[section];
    if (editor && snapshot) {
      editor.onChange(restoreInspectorSection(editor.value, snapshot, section));
      if (section === "component") {
        editor.onFolderPath(folderSnapshots.current[section] ?? editor.folderPath);
      }
    }
    attachmentDraft?.removeFields((fieldKey) => attachmentBelongsToSection(section, fieldKey));
    closeSection(section);
  }
  function closeSection(section: InspectorSection) {
    delete snapshots.current[section];
    delete folderSnapshots.current[section];
    setEditing((current) => {
      const next = new Set(current);
      next.delete(section);
      return next;
    });
  }
  function saveSection(section: InspectorSection) {
    setVisible(copyInspectorRevision(value));
    closeSection(section);
  }
  const controls = (section: InspectorSection) => ({
    section,
    editing: creating || editing.has(section),
    persistentEditing: creating,
    ru,
    onEdit: begin,
    onCancel: cancel,
    onSave: saveSection,
    disabled: editor?.submitting,
  });
  const sectionEditing = (section: InspectorSection) => (
    Boolean(editor) && isInspectorSectionEditing(editorMode, editing, section)
  );
  if (creating && editor) return <CaseCreationSections locale={locale} revision={value}
    editor={editor} sharedSteps={sharedSteps} onResolveSharedStep={onResolveSharedStep} />;
  return <div className={`${css.content} ${css.overviewLayout}`}>
    {editor && <datalist id="case-inspector-folders">{editor.folders.map((folder) => <option key={folder} value={folder} />)}</datalist>}
    <main className={css.primaryColumn}>
      <InspectorSectionView title={ru ? "Описание" : "Description"} {...controls("description")}>
        <MarkdownField attachmentKey="description" value={value.description} label={ru ? "Описание" : "Description"}
          autoFocus={!creating} onChange={sectionEditing("description") && editor ? (description) => patch({ description }) : undefined}
          emptyLabel={ru ? "Описание не указано" : "No description"} />
      </InspectorSectionView>
      <InspectorSectionView title={ru ? "Предусловия" : "Preconditions"} editLabel={ru ? "Изменить условия" : "Edit conditions"} {...controls("preconditions")}>
        <MarkdownField attachmentKey="preconditions" value={value.preconditions} label={ru ? "Предусловия" : "Preconditions"}
          autoFocus={!creating} onChange={sectionEditing("preconditions") && editor ? (preconditions) => patch({ preconditions }) : undefined}
          emptyLabel={ru ? "Предусловия не указаны" : "No preconditions specified"} />
      </InspectorSectionView>
      <InspectorSectionView title={ru ? "Сценарий" : "Scenario"}
        count={value.type === "checklist" ? value.checklist.length : value.steps.length}
        editLabel={ru ? "Изменить сценарий" : "Edit scenario"} {...controls("steps")}>
        <InspectorSteps revision={value} editing={sectionEditing("steps")} autoFocus={!creating}
          ru={ru} sharedSteps={sharedSteps} onResolveSharedStep={onResolveSharedStep} onPatch={patch} />
      </InspectorSectionView>
    </main>
    <aside className={css.sideRail} aria-label={ru ? "Свойства тест-кейса" : "Test case properties"}>
      <InspectorSectionView title={ru ? "Расположение" : "Placement"} {...controls("component")}>
        {sectionEditing("component") && editor ? <div className={css.compactFields}>
          <label><span>{ru ? "Компонент" : "Component"}</span><input autoFocus={!creating} list="case-inspector-components"
            value={value.component} onChange={(event) => patch({ component: event.target.value })} /></label>
          <datalist id="case-inspector-components">{editor.components.map((component) => <option key={component} value={component} />)}</datalist>
          <label><span>{ru ? "Папка" : "Folder"}</span><input list="case-inspector-folders" value={editor.folderPath}
            onChange={(event) => editor.onFolderPath(normalizeFolder(event.target.value))} /></label>
        </div> : <div className={css.railFacts}>
          <span>{ru ? "Компонент" : "Component"}</span><strong>{localizedComponentLabel(locale, value.component) || (ru ? "Не указан" : "Not specified")}</strong>
        </div>}
      </InspectorSectionView>
      <InspectorSectionView title={ru ? "Свойства" : "Properties"} editLabel={ru ? "Изменить свойства" : "Edit properties"} {...controls("properties")}>
        <CaseMetadataControls locale={locale} revision={value} archived={archived} editing={sectionEditing("properties")}
          autoFocus={!creating} showLabels onChange={editor?.onChange} />
      </InspectorSectionView>
      <InspectorSectionView title={ru ? "Дополнительно" : "Additional details"} {...controls("details")}>
        <InspectorDetails revision={value} editing={sectionEditing("details")} autoFocus={!creating} ru={ru} onPatch={patch} />
      </InspectorSectionView>
    </aside>
  </div>;
}
function normalizeFolder(value: string) { return value.startsWith("/") ? value : `/${value}`; }
function attachmentBelongsToSection(section: InspectorSection, fieldKey: string) {
  if (section === "description" || section === "preconditions") return fieldKey === section;
  if (section === "details") return fieldKey === "test-data";
  if (section === "steps") return fieldKey.startsWith("step:") || fieldKey.startsWith("checklist:");
  return false;
}
