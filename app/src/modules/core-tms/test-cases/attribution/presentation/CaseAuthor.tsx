import { useCaseAuthor } from "../state/useCaseAuthor";
import { useWorkspacePeople } from "../../../workspace/members/context/WorkspacePeopleContext";
import { ResponsibleName } from "../../../workspace/members/presentation/ResponsibleName";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
export function CaseAuthor({ caseId }: { caseId: string }) {
  const { workspaceId, offline } = useWorkspacePeople();
  const { locale } = useTmsLocale();
  const author = useCaseAuthor(caseId, workspaceId, offline);
  return <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 0", fontSize: 13 }}>
    <span style={{ color: "var(--muted)" }}>{locale === "ru" ? "Автор тест-кейса" : "Test case author"}</span>
    {author.loading ? <span aria-busy="true" style={{ width: 120, height: 20, borderRadius: 8, background: "var(--control-hover)" }} />
      : author.author ? <ResponsibleName workspaceId={workspaceId} identityId={author.author} offline={offline} /> : <span>—</span>}
  </div>;
}
