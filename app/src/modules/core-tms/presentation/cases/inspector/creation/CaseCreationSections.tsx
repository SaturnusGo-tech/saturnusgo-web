import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { CaseInspectorEditor } from "../model";
import { InspectorDetails } from "../details/InspectorDetails";
import { MarkdownField } from "../markdown/MarkdownField";
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
  const typeLabel = revision.type === "checklist"
    ? (ru ? "Чек-лист" : "Checklist")
    : revision.type === "automated"
      ? (ru ? "Шаги автотеста" : "Automated steps")
      : (ru ? "Шаги" : "Steps");

  return <div className={`${css.content} ${css.creationContent}`}>
    <datalist id="case-inspector-folders">{editor.folders.map((folder) => <option key={folder} value={folder} />)}</datalist>
    <datalist id="case-inspector-components">{editor.components.map((component) => <option key={component} value={component} />)}</datalist>

    <CreationSection number="1" title={ru ? "Основное" : "General"} hint={ru ? "Расположение и функциональность" : "Placement and functionality"} tone="blue">
      <div className={css.creationGrid}>
        <label className={css.creationWideField}>
          <span>{ru ? "Папка репозитория" : "Repository folder"}</span>
          <input list="case-inspector-folders" value={editor.folderPath} onChange={(event) => editor.onFolderPath(normalizeFolder(event.target.value))} />
        </label>
        <label>
          <span>{ru ? "Компонент" : "Component"}</span>
          <input list="case-inspector-components" value={revision.component} onChange={(event) => patch({ component: event.target.value })} placeholder={ru ? "Например, Основной продукт" : "For example, Core product"} />
        </label>
        <label>
          <span>{ru ? "Папка" : "Folder"}</span>
          <input list="case-inspector-folders" value={editor.folderPath} onChange={(event) => editor.onFolderPath(normalizeFolder(event.target.value))} />
        </label>
      </div>
    </CreationSection>

    <CreationSection number="2" title={ru ? "Содержание" : "Content"} hint={ru ? "Что проверяет тест-кейс" : "What the test case verifies"} tone="green">
      <div className={css.creationField}>
        <span>{ru ? "Описание" : "Description"}</span>
        <MarkdownField value={revision.description} label={ru ? "Описание" : "Description"} onChange={(description) => patch({ description })} />
      </div>
    </CreationSection>

    <CreationSection number="3" title={ru ? "Условия и шаги" : "Conditions and steps"} hint={ru ? "Подготовка и последовательность проверки" : "Setup and verification flow"} tone="lavender">
      <div className={css.creationField}>
        <span>{ru ? "Предусловия" : "Preconditions"}</span>
        <MarkdownField value={revision.preconditions} label={ru ? "Предусловия" : "Preconditions"} onChange={(preconditions) => patch({ preconditions })} />
      </div>
      <div className={css.creationField}>
        <span>{typeLabel}</span>
        <InspectorSteps revision={revision} editing autoFocus={false} ru={ru} onPatch={patch} />
      </div>
    </CreationSection>

    <details className={`${css.creationSection} ${css.creationOptional}`}>
      <summary>
        <span className={css.creationNumber}>4</span>
        <span><strong>{ru ? "Дополнительно" : "Additional details"}</strong><small>{ru ? "Необязательно" : "Optional"}</small></span>
        <ChevronDown size={15} aria-hidden="true" />
      </summary>
      <div className={css.creationSectionBody}>
        <InspectorDetails revision={revision} editing autoFocus={false} ru={ru} onPatch={patch} />
      </div>
    </details>
  </div>;
}

function CreationSection({ number, title, hint, tone, children }: {
  number: string;
  title: string;
  hint: string;
  tone: "blue" | "green" | "lavender";
  children: ReactNode;
}) {
  return <section className={`${css.creationSection} ${css[`creationTone_${tone}`]}`}>
    <header><span className={css.creationNumber}>{number}</span><span><strong>{title}</strong><small>{hint}</small></span></header>
    <div className={css.creationSectionBody}>{children}</div>
  </section>;
}

function normalizeFolder(value: string) { return value.startsWith("/") ? value : `/${value}`; }
