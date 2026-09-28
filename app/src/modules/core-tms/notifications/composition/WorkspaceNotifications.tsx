import { browserNotifications } from "../data/browser/browser-notifications";
import { useMemo } from "react";
import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { useOptionalTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { notificationClient } from "../data/notification-client";
import { useNotifications } from "../application/useNotifications";
import { NotificationPage } from "../presentation/NotificationPage";
export function WorkspaceNotifications({ workspaceId }: { workspaceId: string }) {
  const http = useOptionalTmsHttpClient();
  const { locale } = useTmsLocale();
  if (!http || !workspaceId) return <p role="status">{locale === "ru"
    ? "Настройки уведомлений доступны после входа в рабочее пространство."
    : "Sign in to a workspace to configure notifications."}</p>;
  return <ConnectedNotifications http={http} workspaceId={workspaceId} locale={locale} />;
}
function ConnectedNotifications({ http, workspaceId, locale }: { http: TmsHttpClient; workspaceId: string; locale: "ru" | "en" }) {
  const client = useMemo(() => notificationClient(http, workspaceId), [http, workspaceId]);
  const model = useNotifications(client, locale === "ru" ? "ru" : "en", browserNotifications);
  return <NotificationPage model={model} ru={locale === "ru"} embedded />;
}
