import { useEffect, useRef, useState } from "react";
import type { TestCaseRevision } from "../../../../../core/tms/contracts/legacy-contract";
import { localizedComponentLabel } from "../../../localization/format/labels";
import type { TmsLocale } from "../../../localization/model/locale";
import { InspectorDetails } from "./details/InspectorDetails";
import { InspectorSectionView } from "./section/InspectorSectionView";
import { InspectorSteps } from "./steps/InspectorSteps";
import type { CaseInspectorEditor, InspectorSection } from "./model";
import {
  copyInspectorRevision,
  inspectorSectionForMode,
  isInspectorSectionEditing,
  restoreInspectorSection,
} from "./model";
import css from "./caseInspector.module.css";
type Props = {
  locale: TmsLocale;
  revision: TestCaseRevision;
  editor?: CaseInspectorEditor;
  onRequestEdit: () => void;
};
export function CaseInspectorContent({ locale, revision, editor, onRequestEdit }: Props) {
  const ru = locale === "ru";
  const [visible, setVisible] = useState(() => copyInspectorRevision(revision));
  const [editing, setEditing] = useState<InspectorSection | null>(
    inspectorSectionForMode(editor?.mode),
  );
  const snapshot = useRef(copyInspectorRevision(revision));
  const folderSnapshot = useRef(editor?.folderPath ?? "");
  const value = editor?.value ?? visible;
  const editorMode = editor?.mode;
  const creating = editorMode === "create";
  useEffect(() => { setVisible(copyInspectorRevision(revision)); }, [revision]);
  useEffect(() => { if (!editor && editing) setEditing(null); }, [editor, editing]);
  useEffect(() => {
    if (editorMode !== "create" || !editor) return;
    snapshot.current = copyInspectorRevision(editor.value);
    folderSnapshot.current = editor.folderPath;
    setEditing(inspectorSectionForMode(editorMode));
  }, [editorMode]);
  function begin(section: InspectorSection) {
    snapshot.current = copyInspectorRevision(value);
    folderSnapshot.current = editor?.folderPath ?? "";
    setEditing(section);
    if (!editor) onRequestEdit();
  }
  function patch(next: Partial<TestCaseRevision>) {
    if (editor) editor.onChange({ ...editor.value, ...next });
  }
  function cancel(section: InspectorSection) {
    if (editor) {
      editor.onChange(restoreInspectorSection(editor.value, snapshot.current, section));
      if (section === "component") editor.onFolderPath(folderSnapshot.current);
    }
    setEditing(null);
  }
  function saveSection() {
    setVisible(copyInspectorRevision(value));
    setEditing(null);
  }
  const controls = (section: InspectorSection) => ({
    section,
    editing: creating ? section : editing,
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
  return <div className={css.content}>
    {editor && <datalist id="case-inspector-folders">{editor.folders.map((folder) => <option key={folder} value={folder} />)}</datalist>}
    {editor?.mode === "create" && <div className={css.createPlacement}>
      <label>
        <span>{ru ? "Папка репозитория" : "Repository folder"}</span>
        <input
          list="case-inspector-folders"
          value={editor.folderPath}
          onChange={(event) => editor.onFolderPath(normalizeFolder(event.target.value))}
        />
      </label>
    </div>}
    <InspectorSectionView title={ru ? "Описание" : "Description"} {...controls("description")}>
      {sectionEditing("description") && editor
        ? <textarea
            autoFocus={!creating}
            aria-label={ru ? "Описание" : "Description"}
            rows={4}
            value={value.description}
            onChange={(event) => patch({ description: event.target.value })}
          />
        : <p className={!value.description ? css.empty : ""}>
            {value.description || (ru ? "Описание не указано" : "No description")}
          </p>}
    </InspectorSectionView>
    <InspectorSectionView
      title={ru ? "Функциональность" : "Functionality"}
      {...controls("component")}
    >
      {sectionEditing("component") && editor
        ? <div className={css.compactFields}>
            <label>
              <span>{ru ? "Компонент" : "Component"}</span>
              <input
                autoFocus={!creating}
                list="case-inspector-components"
                value={value.component}
                onChange={(event) => patch({ component: event.target.value })}
              />
            </label>
            <datalist id="case-inspector-components">
              {editor.components.map((component) => (
                <option key={component} value={component} />
              ))}
            </datalist>
            <label>
              <span>{ru ? "Папка" : "Folder"}</span>
              <input
                list="case-inspector-folders"
                value={editor.folderPath}
                onChange={(event) => editor.onFolderPath(normalizeFolder(event.target.value))}
              />
            </label>
          </div>
        : <p className={!value.component ? css.empty : ""}>
            {localizedComponentLabel(locale, value.component)
              || (ru ? "Не указана" : "Not specified")}
          </p>}
    </InspectorSectionView>
    <InspectorSectionView
      title={ru ? "Предусловия" : "Preconditions"}
      editLabel={ru ? "Изменить условия" : "Edit conditions"}
      {...controls("preconditions")}
    >
      {sectionEditing("preconditions") && editor
        ? <textarea
            autoFocus={!creating}
            aria-label={ru ? "Предусловия" : "Preconditions"}
            rows={4}
            value={value.preconditions}
            onChange={(event) => patch({ preconditions: event.target.value })}
          />
        : <p className={!value.preconditions ? css.empty : ""}>
            {value.preconditions || (
              ru ? "Предусловия не указаны" : "No preconditions specified"
            )}
          </p>}
    </InspectorSectionView>
    <InspectorSectionView
      title={ru ? "Данные выполнения" : "Execution details"}
      {...controls("details")}
    >
      <InspectorDetails
        revision={value}
        editing={sectionEditing("details")}
        autoFocus={!creating}
        ru={ru}
        onPatch={patch}
      />
    </InspectorSectionView>
    <InspectorSectionView
      title={value.type === "checklist"
        ? (ru ? "Чек-лист" : "Checklist")
        : (ru ? "Шаги" : "Steps")}
      count={value.type === "checklist" ? value.checklist.length : value.steps.length}
      editLabel={ru ? "Изменить шаги" : "Edit steps"}
      {...controls("steps")}
    >
      <InspectorSteps
        revision={value}
        editing={sectionEditing("steps")}
        autoFocus={!creating}
        ru={ru}
        onPatch={patch}
      />
    </InspectorSectionView>
  </div>;
}
function normalizeFolder(value: string) { return value.startsWith("/") ? value : `/${value}`; }
