import { ScenarioLayoutToggle } from "../../../common/scenario/ScenarioLayoutToggle";
import { useScenarioLayout } from "../../../common/scenario/useScenarioLayout";
import type { TestCaseRevision } from "../../../../../../core/tms/contracts/legacy-contract";
import { useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import type { CaseInspectorEditor } from "../model";
import { CreationNarrativeSection } from "./CreationNarrativeSection";
import { InspectorSteps } from "../steps/InspectorSteps";
import css from "../caseInspector.module.css";
import { CaseCreationProperties } from "./properties/CaseCreationProperties";
import properties from "./properties/caseCreationProperties.module.css";
import type { SharedStep, SharedStepSummary } from "../../../../shared-steps/model/shared-step";
import { DraftRequirements } from "../../../../product-docs/requirements/draft/DraftRequirements";

type Props = {
  locale: TmsLocale;
  revision: TestCaseRevision;
  editor: CaseInspectorEditor;
  tagSuggestions?: readonly string[];
  sharedSteps: readonly SharedStepSummary[];
  onResolveSharedStep: (id: string) => Promise<SharedStep | null>;
};

export function CaseCreationSections({
  locale, revision, editor, tagSuggestions, sharedSteps, onResolveSharedStep,
}: Props) {
  const ru = locale === "ru";
  const [layout, setLayout] = useScenarioLayout();
  const patch = (next: Partial<TestCaseRevision>) => editor.onChange({ ...revision, ...next });
  const documentation = editor.documentation && <DraftRequirements projectId={editor.projectId} ru={ru}
    value={editor.documentation.value} onChange={editor.documentation.onChange} retry={editor.documentation.retry} disabled={editor.submitting} />;
  if (editor.documentation?.retry) return <div className={css.creationContent}>
    <CreationSection title={ru ? "Ссылки на статьи" : "Linked pages"}>
      <dl className={css.compactSummary}>{documentation}</dl>
    </CreationSection>
  </div>;
  return <div className={`${css.content} ${css.creationContent} ${css.overviewLayout} ${properties.layout}`}>
    <main className={css.primaryColumn}>
      <CreationNarrativeSection section="description" title={ru ? "Описание" : "Description"}
        value={revision.description} ru={ru} onChange={(description) => patch({ description })} />
      <CreationNarrativeSection section="preconditions" title={ru ? "Предусловия" : "Preconditions"}
        value={revision.preconditions} ru={ru} onChange={(preconditions) => patch({ preconditions })} />
      <CreationSection title={ru ? "Сценарий" : "Scenario"} headingActions={<><span className={css.count}>{revision.type === "checklist" ? revision.checklist.length : revision.steps.length}</span>{revision.type !== "checklist" && <ScenarioLayoutToggle value={layout} onChange={setLayout} ru={ru} />}</>}>
        <InspectorSteps revision={revision} editing layout={layout} autoFocus={false} ru={ru}
          sharedSteps={sharedSteps} onResolveSharedStep={onResolveSharedStep} onPatch={patch} />
      </CreationSection>
    </main>
    <CaseCreationProperties locale={locale} revision={revision} editor={editor}
      tagSuggestions={tagSuggestions} documentation={documentation} />
  </div>;
}

function CreationSection({ title, children, headingActions }: { title: string; children: React.ReactNode; headingActions?: React.ReactNode }) {
  return <section className={`${css.section} ${css.creationSection}`}>
    <header><h3>{title}</h3>{headingActions}</header>
    <div className={css.sectionBody}>{children}</div>
  </section>;
}
