import type { ReactNode } from "react";
import type { TestCaseRevision } from "../../../../../../../core/tms/contracts/legacy-contract";
import type { TmsLocale } from "../../../../../localization/model/locale";
import { PropertyRail } from "../../../../common/properties/rail/PropertyRail";
import { CaseMetadataControls } from "../../../detail/metadata/CaseMetadataControls";
import { InspectorDetails } from "../../details/InspectorDetails";
import { CaseCustomFields } from "../../fields/CaseCustomFields";
import { FolderPathPicker } from "../../placement/FolderPathPicker";
import type { CaseInspectorEditor } from "../../model";
import css from "./caseCreationProperties.module.css";

export function CaseCreationProperties({ locale, revision, editor, tagSuggestions, documentation }: {
  locale: TmsLocale; revision: TestCaseRevision; editor: CaseInspectorEditor;
  tagSuggestions?: readonly string[]; documentation?: ReactNode;
}) {
  const ru = locale === "ru";
  const disabled = editor.submitting || editor.attachmentsPending;
  const patch = (next: Partial<TestCaseRevision>) => editor.onChange({ ...revision, ...next });
  return <PropertyRail className={css.properties} title={ru ? "Свойства" : "Properties"}
    label={ru ? "Свойства нового тест-кейса" : "New test case properties"}>
    <FolderPathPicker value={editor.folderPath} folders={editor.folders}
      onChange={editor.onFolderPath} ru={ru} disabled={disabled} />
    <CaseCustomFields projectId={editor.projectId} revision={revision} editing creating requiredFields={editor.requiredFields}
      canCreate={editor.canCreateFieldValues} disabled={disabled} ru={ru} onPatch={patch} />
    <CaseMetadataControls locale={locale} revision={revision} editing disabled={disabled} onChange={editor.onChange} />
    <InspectorDetails tagSuggestions={tagSuggestions} revision={revision} editing creating
      disabled={disabled} ru={ru} onPatch={patch} documentation={documentation} />
  </PropertyRail>;
}
