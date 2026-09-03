import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../../../localization/model/locale";
import { CaseMetadataControls } from "../../detail/metadata/CaseMetadataControls";
import { InspectorDetails } from "../details/InspectorDetails";
import { MarkdownField } from "../markdown/MarkdownField";
import type { CaseInspectorEditor } from "../model";
import { InspectorSteps } from "../steps/InspectorSteps";
import css from "../caseInspector.module.css";

type Props = {
  locale: TmsLocale;
  revision: TestCaseRevision;
  editor: CaseInspectorEditor;
};

export function CaseCreationSections({ locale, revision, editor }: Props) {
  const ru = locale === "ru";
  const patch = (next: Partial<TestCaseRevision>) => editor.onChange({ ...revision, ...next });
  return <div className={`${css.content} ${css.creationContent} ${css.overviewLayout}`}>
    <datalist id="case-inspector-folders">{editor.folders.map((folder) => <option key={folder} value={folder} />)}</datalist>
    <datalist id="case-inspector-components">{editor.components.map((component) => <option key={component} value={component} />)}</datalist>
    <main className={css.primaryColumn}>
      <CreationSection title={ru ? "Описание" : "Description"}>
        <MarkdownField attachmentKey="description" value={revision.description}
          label={ru ? "Описание" : "Description"} onChange={(description) => patch({ description })} />
      </CreationSection>
      <CreationSection title={ru ? "Предусловия" : "Preconditions"}>
        <MarkdownField attachmentKey="preconditions" value={revision.preconditions}
          label={ru ? "Предусловия" : "Preconditions"} onChange={(preconditions) => patch({ preconditions })} />
      </CreationSection>
      <CreationSection title={ru ? "Сценарий" : "Scenario"}>
        <InspectorSteps revision={revision} editing autoFocus={false} ru={ru} onPatch={patch} />
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

function CreationSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className={`${css.section} ${css.creationSection}`}>
    <header><h3>{title}</h3></header>
    <div className={css.sectionBody}>{children}</div>
  </section>;
}

function normalizeFolder(value: string) { return value.startsWith("/") ? value : `/${value}`; }
