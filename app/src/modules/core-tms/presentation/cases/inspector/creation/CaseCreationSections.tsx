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
    <datalist id="case-inspector-folders">{editor.folders.map((folder) => <option key={folder} value={folder} />)}</datalist>
    <datalist id="case-inspector-components">{editor.components.map((component) => <option key={component} value={component} />)}</datalist>
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
        <div className={css.railFields}>
          <label><span>{ru ? "Компонент" : "Component"}</span><input list="case-inspector-components"
            value={revision.component} onChange={(event) => patch({ component: event.target.value })}
            placeholder={ru ? "Добавить компонент" : "Add component"} /></label>
          <label><span>{ru ? "Папка" : "Folder"}</span><input list="case-inspector-folders"
            value={editor.folderPath} onChange={(event) => editor.onFolderPath(normalizeFolder(event.target.value))} /></label>
        </div>
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
    <MarkdownField attachmentKey={section} value={value} label={title}
      autoFocus={editing} onChange={editing ? onChange : undefined} emptyLabel={emptyLabel} />
  </InspectorSectionView>;
}

function CreationSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className={`${css.section} ${css.creationSection}`}>
    <header><h3>{title}</h3></header>
    <div className={css.sectionBody}>{children}</div>
  </section>;
}

function normalizeFolder(value: string) { return value.startsWith("/") ? value : `/${value}`; }
