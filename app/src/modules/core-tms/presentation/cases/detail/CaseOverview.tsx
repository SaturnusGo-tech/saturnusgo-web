import type { TestCaseRevision } from "../../../../../core/tms/contracts/legacy-contract";
import type { CaseInspectorEditor } from "../inspector/model";
import type { TmsLocale } from "../../../localization/model/locale";
import { CaseInspectorContent } from "../inspector/CaseInspectorContent";
import { CaseCommentsSection } from "../collaboration/comments/CaseCommentsTab";
import type { CaseCollaborationViewModel } from "../collaboration/model";
import type { SharedStep, SharedStepSummary } from "../../../shared-steps/model/shared-step";

export function CaseOverview({
  locale,
  revision,
  tagSuggestions,
  editor,
  onRequestEdit,
  testCaseId,
  projectId,
  languageTag,
  collaboration,
  archived,
  readOnly,
  sharedSteps,
  onResolveSharedStep,
}: {
  locale: TmsLocale;
  revision: TestCaseRevision;
  tagSuggestions?: readonly string[];
  editor?: CaseInspectorEditor;
  onRequestEdit: () => void;
  testCaseId?: string;
  projectId?: string;
  languageTag: string;
  collaboration: CaseCollaborationViewModel;
  archived?: boolean;
  readOnly?: boolean;
  sharedSteps: readonly SharedStepSummary[];
  onResolveSharedStep: (id: string) => Promise<SharedStep | null>;
}) {
  return <>
    <CaseInspectorContent
      testCaseId={testCaseId}
      projectId={projectId}
      locale={locale}
      revision={revision}
      tagSuggestions={tagSuggestions}
      archived={archived}
      readOnly={readOnly}
      editor={editor}
      sharedSteps={sharedSteps}
      onResolveSharedStep={onResolveSharedStep}
      onRequestEdit={onRequestEdit}
    />
    {testCaseId && <CaseCommentsSection
      hideHeading
      caseId={testCaseId}
      locale={locale}
      languageTag={languageTag}
      model={collaboration}
    />}
  </>;
}
