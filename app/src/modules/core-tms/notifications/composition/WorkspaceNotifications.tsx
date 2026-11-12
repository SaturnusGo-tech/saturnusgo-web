import { useOptionalTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { ConnectedNotifications } from "./connected/ConnectedNotifications";
export function WorkspaceNotifications({ workspaceId }: { workspaceId: string }) {
  const http = useOptionalTmsHttpClient(), session = useOptionalTmsSession();
  const { locale } = useTmsLocale();
  if (!http || !workspaceId) return <p role="status">{locale === "ru"
    ? "Настройки уведомлений доступны после входа в рабочее пространство."
    : "Sign in to a workspace to configure notifications."}</p>;
  return <ConnectedNotifications key={JSON.stringify([workspaceId, session?.subject])} http={http} workspaceId={workspaceId} locale={locale}/>;
}
