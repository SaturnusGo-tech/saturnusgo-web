import { visitWorkspace } from "../../state/navigation/browser/workspace-history";
import { browserNotifications } from "../data/browser/browser-notifications";
import { useMemo } from "react";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { notificationClient } from "../data/notification-client";
import { useNotifications } from "../application/useNotifications";
import { NotificationPage } from "../presentation/NotificationPage";
export function WorkspaceNotifications({ workspaceId }: { workspaceId: string }) {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale();
  const client = useMemo(() => notificationClient(http, workspaceId), [http, workspaceId]);
  const model = useNotifications(client, locale === "ru" ? "ru" : "en", browserNotifications);
  return <NotificationPage model={model} ru={locale === "ru"} onOpen={visitWorkspace} />;
}
