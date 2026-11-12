import { useEffect, useMemo } from "react";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { isFalconDesktop } from "../../../auth/sign-in/domain/desktop-mode";
import { browserNotifications } from "../../data/browser/browser-notifications";
import { notificationClient } from "../../data/notification-client";
import { useNotifications } from "../../application/useNotifications";
import { desktopNotificationCommand } from "../../domain/native/desktop-notification-command";
import { NotificationPage } from "../../presentation/NotificationPage";
import { NotificationPreferencesPage } from "../../presentation/window/NotificationPreferencesPage";
export function ConnectedNotifications({ http, workspaceId, locale, advancedOnly = false }: {
  http: TmsHttpClient; workspaceId: string; locale: "ru" | "en"; advancedOnly?: boolean;
}) {
  const session = useOptionalTmsSession();
  const client = useMemo(() => notificationClient(http, workspaceId), [http, workspaceId]);
  const model = useNotifications(client, locale, browserNotifications);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") void model.refresh(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [model.refresh]);
  if (advancedOnly) return <NotificationPreferencesPage model={model} ru={locale === "ru"}/>;
  const nativeSession = (session?.kind === "cloud" || session?.kind === "managed") && session.workspaceId === workspaceId;
  const command = nativeSession ? desktopNotificationCommand(workspaceId, "notifications") : null;
  return <NotificationPage model={model} ru={locale === "ru"} embedded desktop={isFalconDesktop()} workspaceId={nativeSession ? workspaceId : undefined}
    onOpenAdvanced={command ? () => { window.location.href = command; } : undefined}/>;
}
