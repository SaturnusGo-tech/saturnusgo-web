import type { TestCaseRevision } from "../../../../../core/tms/contracts/legacy-contract";
import type { CaseInspectorEditor } from "../inspector/model";
import type { TmsLocale } from "../../../localization/model/locale";
import { CaseInspectorContent } from "../inspector/CaseInspectorContent";
import { CaseCommentsSection } from "../collaboration/comments/CaseCommentsTab";
import type { CaseCollaborationViewModel } from "../collaboration/model";

export function CaseOverview({
  locale,
  revision,
  editor,
  onRequestEdit,
  testCaseId,
  languageTag,
  collaboration,
  archived,
}: {
  locale: TmsLocale;
  revision: TestCaseRevision;
  editor?: CaseInspectorEditor;
  onRequestEdit: () => void;
  testCaseId?: string;
  languageTag: string;
  collaboration: CaseCollaborationViewModel;
  archived?: boolean;
}) {
  return <>
    <CaseInspectorContent
      locale={locale}
      revision={revision}
      archived={archived}
      editor={editor}
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
