import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { documentationCatalog } from "../localization/catalog/locale-catalog";
import { useWorkspacePeople } from "../../workspace/members/context/WorkspacePeopleContext";

export function useDocumentationCatalog() {
  const session = useOptionalTmsSession();
  const { locale } = useTmsLocale();
  const { workspaceId } = useWorkspacePeople();
  const administrator = session?.kind === "admin" || Boolean(workspaceId && session?.workspaceId === workspaceId
    && session.workspaceRole === "workspace_admin");
  return documentationCatalog(locale, administrator);
}
