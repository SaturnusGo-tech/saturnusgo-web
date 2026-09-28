import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useWorkspacePeople } from "../../../workspace/members/context/WorkspacePeopleContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useGuideConversation } from "./useGuideConversation";
import { useGuideChatRoute } from "../navigation/useGuideChatRoute";

export function useDocumentationChat() {
  const http = useOptionalTmsHttpClient();
  const session = useOptionalTmsSession();
  const workspace = useWorkspacePeople();
  const { locale } = useTmsLocale();
  const route = useGuideChatRoute(session?.subject ?? session?.kind ?? "anonymous");
  return useGuideConversation({ http, workspaceId: workspace.workspaceId, locale,
    subject: session?.subject ?? session?.kind ?? "anonymous", enabled: Boolean(workspace.workspaceId) && !workspace.offline,
    route, routeReady: route.ready, onOpen: route.open });
}
