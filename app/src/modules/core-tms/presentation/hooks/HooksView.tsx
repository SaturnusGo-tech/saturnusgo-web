"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getYouTrackConfiguration,
  getYouTrackIntegrationStatus,
  type YouTrackIntegrationStatus,
} from "../../application/integrations/getYouTrackIntegrationStatus";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { YouTrackConfiguration } from "../../youtrack/model/youtrack-settings";
import { IntegrationCatalog } from "./catalog/IntegrationCatalog";
import surface from "./hooks.module.css";
import { hooksCopy } from "./shared/hooks-copy";
import { YouTrackSettings } from "./youtrack/YouTrackSettings";

export function HooksView({ workspaceId, canManage }: { workspaceId: string; canManage: boolean }) {
  const http = useTmsHttpClient();
  const { locale, languageTag } = useTmsLocale();
  const russian = locale === "ru";
  const [screen, setScreen] = useState<"catalog" | "youtrack">("catalog");
  const [status, setStatus] = useState<YouTrackIntegrationStatus | null>(null);
  const [configuration, setConfiguration] = useState<YouTrackConfiguration | null>(null);
  const [statusFailed, setStatusFailed] = useState(false);
  const [configurationFailed, setConfigurationFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const refresh = useCallback(() => setReload((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus(null);
    setConfiguration(null);
    setStatusFailed(false);
    setConfigurationFailed(false);
    void getYouTrackIntegrationStatus(http, workspaceId, controller.signal)
      .then(setStatus)
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setStatusFailed(true);
      });
    void getYouTrackConfiguration(http, workspaceId, controller.signal)
      .then((resource) => setConfiguration(resource.data))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setConfigurationFailed(true);
        }
      });
    return () => controller.abort();
  }, [http, workspaceId, reload]);

  if (screen === "youtrack") {
    return <YouTrackSettings
      workspaceId={workspaceId}
      status={status}
      languageTag={languageTag}
      russian={russian}
      canManage={canManage}
      onBack={() => setScreen("catalog")}
      onStatusChange={refresh}
    />;
  }
  return (
    <div className={surface.root} data-testid="hooks-view">
      <IntegrationCatalog
        russian={russian}
        copy={hooksCopy(russian)}
        configuration={configuration}
        status={status}
        statusFailed={statusFailed || configurationFailed}
        onRefresh={refresh}
        onOpenYouTrack={() => setScreen("youtrack")}
      />
    </div>
  );
}
