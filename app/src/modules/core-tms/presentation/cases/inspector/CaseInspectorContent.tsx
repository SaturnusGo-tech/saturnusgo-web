import { ScenarioLayoutToggle } from "../../common/scenario/ScenarioLayoutToggle";
import { useScenarioLayout } from "../../common/scenario/useScenarioLayout";
import { useEffect, useRef, useState } from "react";
import type { TestCaseRevision } from "../../../../../core/tms/contracts/legacy-contract";
import { CaseCustomFields } from "./fields/CaseCustomFields";
import { FolderPathPicker } from "./placement/FolderPathPicker";
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
  testCaseId?: string;
  locale: TmsLocale; revision: TestCaseRevision; archived?: boolean; editor?: CaseInspectorEditor;
  sharedSteps: readonly SharedStepSummary[];
  onResolveSharedStep: (id: string) => Promise<SharedStep | null>;
  onRequestEdit: () => void;
};
export function CaseInspectorContent({
  locale, revision, archived, editor, sharedSteps, onResolveSharedStep, onRequestEdit, testCaseId,
}: Props) {
  const ru = locale === "ru";
  const [layout, setLayout] = useScenarioLayout();
  const attachmentDraft = useCaseAttachmentDraft();
  const [visible, setVisible] = useState(() => copyInspectorRevision(revision));
  const [editing, setEditing] = useState<ReadonlySet<InspectorSection>>(() => new Set());
  const snapshots = useRef<Partial<Record<InspectorSection, TestCaseRevision>>>({});
  const folderSnapshots = useRef<Partial<Record<InspectorSection, string>>>({});
  const editorMode = editor?.mode;
  const creating = editorMode === "create";
  const readOnly = Boolean(archived) && !creating;
  const value = readOnly ? visible : editor?.value ?? visible;
  useEffect(() => { setVisible(copyInspectorRevision(revision)); }, [revision]);
  useEffect(() => {
    if (editor) return;
    setEditing(new Set());
    snapshots.current = {};
    folderSnapshots.current = {};
  }, [editor]);
  function begin(section: InspectorSection) {
    if (readOnly) return;
    if (snapshots.current[section]) return;
    snapshots.current[section] = copyInspectorRevision(value);
    folderSnapshots.current[section] = editor?.folderPath ?? "";
    setEditing((current) => new Set(current).add(section));
    if (!editor) onRequestEdit();
  }
  function patch(next: Partial<TestCaseRevision>) {
    if (editor && !readOnly && !editor.submitting && !editor.attachmentsPending) editor.onChange({ ...editor.value, ...next });
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
    editing: !readOnly && (creating || editing.has(section)),
    persistentEditing: creating,
    ru,
    onEdit: begin,
    onCancel: cancel,
    onSave: saveSection,
    disabled: readOnly || editor?.submitting || editor?.attachmentsPending,
  });
  const sectionEditing = (section: InspectorSection) => (
    !readOnly && Boolean(editor) && isInspectorSectionEditing(editorMode, editing, section)
  );
  if (creating && editor) return <CaseCreationSections locale={locale} revision={value}
    editor={editor} sharedSteps={sharedSteps} onResolveSharedStep={onResolveSharedStep} />;
  return <div className={`${css.content} ${css.overviewLayout}`}>
    <main className={css.primaryColumn}>
      <InspectorSectionView title={ru ? "Описание" : "Description"} {...controls("description")}>
        <MarkdownField appearance="plain" onRequestEdit={!readOnly && !editor?.submitting && !editor?.attachmentsPending ? () => begin("description") : undefined} attachmentKey="description" value={value.description} label={ru ? "Описание" : "Description"}
          autoFocus={!creating} onChange={sectionEditing("description") && editor ? (description) => patch({ description }) : undefined}
          emptyLabel={ru ? "Описание не указано" : "No description"} />
      </InspectorSectionView>
      <InspectorSectionView title={ru ? "Предусловия" : "Preconditions"} editLabel={ru ? "Изменить условия" : "Edit conditions"} {...controls("preconditions")}>
        <MarkdownField appearance="plain" onRequestEdit={!readOnly && !editor?.submitting && !editor?.attachmentsPending ? () => begin("preconditions") : undefined} attachmentKey="preconditions" value={value.preconditions} label={ru ? "Предусловия" : "Preconditions"}
          autoFocus={!creating} onChange={sectionEditing("preconditions") && editor ? (preconditions) => patch({ preconditions }) : undefined}
          emptyLabel={ru ? "Предусловия не указаны" : "No preconditions specified"} />
      </InspectorSectionView>
      <InspectorSectionView title={ru ? "Сценарий" : "Scenario"}
        headingActions={value.type !== "checklist" && <ScenarioLayoutToggle value={layout} onChange={setLayout} ru={ru} />}
        count={value.type === "checklist" ? value.checklist.length : value.steps.length}
        editLabel={ru ? "Изменить сценарий" : "Edit scenario"} {...controls("steps")}>
        <InspectorSteps layout={layout} revision={value} editing={sectionEditing("steps")} autoFocus={!creating}
          ru={ru} sharedSteps={sharedSteps} onResolveSharedStep={onResolveSharedStep} onPatch={patch} />
      </InspectorSectionView>
    </main>
    <aside className={css.sideRail} aria-label={ru ? "Свойства тест-кейса" : "Test case properties"}>
      <InspectorSectionView title={ru ? "Поля" : "Custom fields"} {...controls("component")}>
        {sectionEditing("component") && editor && <FolderPathPicker value={editor.folderPath} folders={editor.folders} onChange={editor.onFolderPath} ru={ru} disabled={editor.submitting} />}
        <CaseCustomFields projectId={editor?.projectId} revision={value} editing={sectionEditing("component")} canCreate={editor?.canCreateFieldValues} disabled={editor?.submitting || editor?.attachmentsPending} ru={ru} onPatch={patch} />
      </InspectorSectionView>
      <InspectorSectionView title={ru ? "Свойства" : "Properties"} editLabel={ru ? "Изменить свойства" : "Edit properties"} {...controls("properties")}>
        <CaseMetadataControls locale={locale} revision={value} archived={archived} editing={sectionEditing("properties")}
          autoFocus={!creating} showLabels onChange={readOnly ? undefined : editor?.onChange} />
      </InspectorSectionView>
      <InspectorSectionView title={ru ? "Дополнительно" : "Additional details"} {...controls("details")}>
        <InspectorDetails testCaseId={testCaseId} revision={value} editing={sectionEditing("details")} autoFocus={!creating} ru={ru} onPatch={patch} />
      </InspectorSectionView>
    </aside>
  </div>;
}
function attachmentBelongsToSection(section: InspectorSection, fieldKey: string) {
  if (section === "description" || section === "preconditions") return fieldKey === section;
  if (section === "details") return fieldKey === "test-data";
  if (section === "steps") return fieldKey.startsWith("step:") || fieldKey.startsWith("checklist:");
  return false;
}
