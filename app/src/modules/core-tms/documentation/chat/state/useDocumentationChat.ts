import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useWorkspacePeople } from "../../../workspace/members/context/WorkspacePeopleContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useGuideConversation } from "./useGuideConversation";

export function useDocumentationChat() {
  const http = useOptionalTmsHttpClient();
  const session = useOptionalTmsSession();
  const workspace = useWorkspacePeople();
  const { locale } = useTmsLocale();
  return useGuideConversation({ http, workspaceId: workspace.workspaceId, locale,
    subject: session?.subject ?? session?.kind ?? "anonymous", enabled: Boolean(workspace.workspaceId) && !workspace.offline });
}
