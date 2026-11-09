import { useCaseAuthor } from "../state/useCaseAuthor";
import { useWorkspacePeople } from "../../../workspace/members/context/WorkspacePeopleContext";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
export function CaseAuthor({ caseId }: { caseId: string }) {
  const { workspaceId, offline } = useWorkspacePeople();
  const { locale } = useTmsLocale();
  const author = useCaseAuthor(caseId, workspaceId, offline);
  const label = locale === "ru" ? "Автор тест-кейса" : "Test case author";
  if (author.loading) return <span role="status" aria-label={label}
    style={{ display: "block", width: 104, height: 16, borderRadius: 5, background: "var(--falcon-hover)" }} />;
  return author.author ? <ResponsibleName workspaceId={workspaceId} identityId={author.author} offline={offline} profileLabel={label} /> : null;
}
