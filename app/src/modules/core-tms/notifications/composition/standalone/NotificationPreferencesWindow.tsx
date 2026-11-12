import { useEffect, useState } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { TmsAuthState } from "../../../auth/presentation/state/TmsAuthState";
import { ConnectedNotifications } from "../connected/ConnectedNotifications";
export function NotificationPreferencesWindow() {
  const http = useOptionalTmsHttpClient(), session = useOptionalTmsSession(), { locale } = useTmsLocale();
  const [requested, setRequested] = useState<string | null>(null);
  useEffect(() => {
    const ids = new URLSearchParams(window.location.search).getAll("workspaceId");
    setRequested(ids.length === 1 && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(ids[0]) ? ids[0] : "");
  }, []);
  if (requested === null) return <TmsAuthState kind="loading"/>;
  if (!http || !requested || !session?.subject || session.workspaceId !== requested) return <TmsAuthState kind="error"/>;
  return <div data-falcon-workspace><ConnectedNotifications key={JSON.stringify([requested, session.subject])}
    http={http} workspaceId={requested} locale={locale} advancedOnly/></div>;
}
