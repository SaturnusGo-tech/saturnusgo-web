import { CaseCustomFields } from "../fields/CaseCustomFields";
import { FolderPathPicker } from "../placement/FolderPathPicker";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import { useRef, useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { CaseMetadataControls } from "../../detail/metadata/CaseMetadataControls";
import { InspectorDetails } from "../details/InspectorDetails";
import { MarkdownField } from "../markdown/MarkdownField";
import type { CaseInspectorEditor, InspectorSection } from "../model";
import { InspectorSectionView } from "../section/InspectorSectionView";
import { InspectorSteps } from "../steps/InspectorSteps";
import css from "../caseInspector.module.css";
import type { SharedStep, SharedStepSummary } from "../../../../shared-steps/model/shared-step";

type Props = {
  locale: TmsLocale;
  revision: TestCaseRevision;
  editor: CaseInspectorEditor;
  sharedSteps: readonly SharedStepSummary[];
  onResolveSharedStep: (id: string) => Promise<SharedStep | null>;
};

export function CaseCreationSections({
  locale, revision, editor, sharedSteps, onResolveSharedStep,
}: Props) {
  const ru = locale === "ru";
  const patch = (next: Partial<TestCaseRevision>) => editor.onChange({ ...revision, ...next });
  return <div className={`${css.content} ${css.creationContent} ${css.overviewLayout}`}>
    <main className={css.primaryColumn}>
      <CreationNarrativeSection section="description" title={ru ? "Описание" : "Description"}
        value={revision.description} ru={ru} onChange={(description) => patch({ description })} />
      <CreationNarrativeSection section="preconditions" title={ru ? "Предусловия" : "Preconditions"}
        value={revision.preconditions} ru={ru} onChange={(preconditions) => patch({ preconditions })} />
      <CreationSection title={ru ? "Сценарий" : "Scenario"}>
        <InspectorSteps revision={revision} editing autoFocus={false} ru={ru}
          sharedSteps={sharedSteps} onResolveSharedStep={onResolveSharedStep} onPatch={patch} />
      </CreationSection>
    </main>
    <aside className={css.sideRail} aria-label={ru ? "Свойства нового тест-кейса" : "New test case properties"}>
      <CreationSection title={ru ? "Расположение" : "Placement"}>
        <FolderPathPicker value={editor.folderPath} folders={editor.folders} onChange={editor.onFolderPath} ru={ru} disabled={editor.submitting} />
      </CreationSection>
      <CreationSection title={ru ? "Поля" : "Custom fields"}>
        <CaseCustomFields projectId={editor.projectId} revision={revision} editing canCreate={editor.canCreateFieldValues} disabled={editor.submitting} ru={ru} onPatch={patch} />
      </CreationSection>
      <CreationSection title={ru ? "Свойства" : "Properties"}>
        <CaseMetadataControls locale={locale} revision={revision} editing showLabels onChange={editor.onChange} />
      </CreationSection>
      <CreationSection title={ru ? "Дополнительно" : "Additional details"}>
        <InspectorDetails revision={revision} editing autoFocus={false} ru={ru} onPatch={patch} />
      </CreationSection>
    </aside>
  </div>;
}

function CreationNarrativeSection({ section, title, value, ru, onChange }: {
  section: Extract<InspectorSection, "description" | "preconditions">;
  title: string;
  value: string;
  ru: boolean;
  onChange: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const snapshot = useRef(value);
  const emptyLabel = section === "description"
    ? (ru ? "Описание не указано" : "No description")
    : (ru ? "Предусловия не указаны" : "No preconditions specified");
  return <InspectorSectionView title={title} section={section} editing={editing} ru={ru}
    onEdit={() => { snapshot.current = value; setEditing(true); }}
    onCancel={() => { onChange(snapshot.current); setEditing(false); }}
    onSave={() => setEditing(false)}>
    <MarkdownField appearance="plain" onRequestEdit={() => { snapshot.current = value; setEditing(true); }} attachmentKey={section} value={value} label={title}
      autoFocus={editing} onChange={editing ? onChange : undefined} emptyLabel={emptyLabel} />
  </InspectorSectionView>;
}

function CreationSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className={`${css.section} ${css.creationSection}`}>
    <header><h3>{title}</h3></header>
    <div className={css.sectionBody}>{children}</div>
  </section>;
}
