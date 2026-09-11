import { useCaseCollaboration } from "../../../../state/case-collaboration/useCaseCollaboration";
import { CaseCommentsSection } from "../../../cases/collaboration/comments/CaseCommentsTab";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
export function DefectDiscussion({ defectId, projectId, connected, canComment }: {
 defectId: string; projectId: string; connected: boolean; canComment: boolean;
}) {
 const { locale, languageTag } = useTmsLocale();
 const model = useCaseCollaboration({ active: true, connected, canComment, canConfirmFix: false,
   targetKind: "defect", projectId, caseId: defectId });
 return <CaseCommentsSection key={defectId} caseId={defectId} locale={locale} languageTag={languageTag} model={model} />;
}
