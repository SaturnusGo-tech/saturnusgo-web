import type { TestCaseRevision } from "../../../../../core/tms/contracts/legacy-contract";
import type { CaseInspectorEditor } from "../inspector/model";
import type { TmsLocale } from "../../../localization/model/locale";
import { CaseInspectorContent } from "../inspector/CaseInspectorContent";

export function CaseOverview({
  locale,
  revision,
  editor,
  onRequestEdit,
}: {
  locale: TmsLocale;
  revision: TestCaseRevision;
  editor?: CaseInspectorEditor;
  onRequestEdit: () => void;
}) {
  return <CaseInspectorContent
    locale={locale}
    revision={revision}
    editor={editor}
    onRequestEdit={onRequestEdit}
  />;
}
