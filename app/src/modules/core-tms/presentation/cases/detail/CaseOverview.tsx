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
  editor,
  onRequestEdit,
  testCaseId,
  languageTag,
  collaboration,
  archived,
  sharedSteps,
  onResolveSharedStep,
}: {
  locale: TmsLocale;
  revision: TestCaseRevision;
  editor?: CaseInspectorEditor;
  onRequestEdit: () => void;
  testCaseId?: string;
  languageTag: string;
  collaboration: CaseCollaborationViewModel;
  archived?: boolean;
  sharedSteps: readonly SharedStepSummary[];
  onResolveSharedStep: (id: string) => Promise<SharedStep | null>;
}) {
  return <>
    <CaseInspectorContent
      locale={locale}
      revision={revision}
      archived={archived}
      editor={editor}
      sharedSteps={sharedSteps}
      onResolveSharedStep={onResolveSharedStep}
      onRequestEdit={onRequestEdit}
    />
    {testCaseId && <CaseCommentsSection
      caseId={testCaseId}
      locale={locale}
      languageTag={languageTag}
      model={collaboration}
    />}
  </>;
}
