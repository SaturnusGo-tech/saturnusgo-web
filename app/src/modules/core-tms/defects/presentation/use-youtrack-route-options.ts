import { useEffect, useMemo, useState } from "react";

import { getYouTrackConfiguration } from "../../application/integrations/getYouTrackIntegrationStatus";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import type { TmsLocale } from "../../localization/model/locale";
import type { YouTrackRoute } from "../../youtrack/model/youtrack-settings";

export function useYouTrackRouteOptions(workspaceId: string, locale: TmsLocale) {
  const http = useTmsHttpClient();
  const [routes, setRoutes] = useState<readonly YouTrackRoute[]>([]);
  const [configurationVersion, setConfigurationVersion] = useState<1 | 2 | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading"); setRoutes([]); setConfigurationVersion(null); setEnabled(false);
    void getYouTrackConfiguration(http, workspaceId, controller.signal)
      .then((resource) => {
        setConfigurationVersion(resource.data.configurationVersion === 2 ? 2 : 1);
        setEnabled(resource.data.enabled);
        setRoutes(resource.data.enabled
          ? (resource.data.routes ?? []).filter((route) => route.enabled)
          : []);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setRoutes([]); setConfigurationVersion(null); setEnabled(false); setStatus("error");
        }
      });
    return () => controller.abort();
  }, [http, workspaceId]);

  const options = useMemo(() => routes.map((route) => ({
    value: route.id, label: routeLabel(route, locale),
  })), [locale, routes]);
  return { options, configurationVersion, enabled, status } as const;
}

function routeLabel(route: YouTrackRoute, locale: TmsLocale): string {
  if (route.isDefault) {
    return locale === "ru"
      ? `${route.project.name} · по умолчанию`
      : `${route.project.name} · default`;
  }
  const field = route.match?.field === "tag"
    ? (locale === "ru" ? "Тег" : "Tag")
    : (locale === "ru" ? "Компонент" : "Component");
  return `${field}: ${route.match?.value || "—"} → ${route.project.name}`;
}
