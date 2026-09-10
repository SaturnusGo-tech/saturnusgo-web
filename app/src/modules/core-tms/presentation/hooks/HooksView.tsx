"use client";

import { transitionContent } from "../workspace/motion/transition/content-transition";
import { useCallback, useEffect, useState } from "react";

import {
  getYouTrackConfiguration,
  getYouTrackIntegrationStatus,
  type YouTrackIntegrationStatus,
} from "../../application/integrations/getYouTrackIntegrationStatus";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { YouTrackConfiguration } from "../../youtrack/model/youtrack-settings";
import { ConnectorSettings } from "../../connectors/presentation/ConnectorSettings";
import { useWorkspaceConnectors } from "../../connectors/application/context/WorkspaceConnectorContext";
import { isProvider, type Provider } from "../../connectors/model/connector-types";
import { IntegrationCatalog } from "./catalog/IntegrationCatalog";
import surface from "./hooks.module.css";
import { hooksCopy } from "./shared/hooks-copy";
import { YouTrackSettings } from "./youtrack/YouTrackSettings";

export function HooksView({ workspaceId, projectId, canManage, capabilities, connected }: { workspaceId: string; projectId: string; canManage: boolean; capabilities: readonly string[]; connected: boolean }) {
  const http = useTmsHttpClient();
  const { locale, languageTag } = useTmsLocale();
  const russian = locale === "ru";
  const [screen, setScreen] = useState<"catalog" | "youtrack" | Provider>(() => {
    const selected = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("integration");
    return selected && (isProvider(selected) || selected === "youtrack") ? selected : "catalog";
  });
  const [status, setStatus] = useState<YouTrackIntegrationStatus | null>(null);
  const [configuration, setConfiguration] = useState<YouTrackConfiguration | null>(null);
  const [statusFailed, setStatusFailed] = useState(false);
  const [configurationFailed, setConfigurationFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const connectors = useWorkspaceConnectors();
  const open = (target: "catalog" | "youtrack" | Provider) => transitionContent(() => {
    setScreen(target);
    const url = new URL(window.location.href);
    url.searchParams.delete("analysisId"); url.searchParams.delete("impact");
    if (target === "catalog") url.searchParams.delete("integration"); else url.searchParams.set("integration", target);
    window.history.replaceState(window.history.state, "", url);
  });
  const refresh = useCallback(() => { setReload((value) => value + 1); connectors.refresh(); }, [connectors.refresh]);

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

  if (isProvider(screen)) return <ConnectorSettings key={`${workspaceId}:${projectId}:${screen}`}
    workspaceId={workspaceId} projectId={projectId} provider={screen} ru={russian} canManage={canManage} capabilities={capabilities} connected={connected}
    onBack={() => open("catalog")} onSaved={refresh} />;
  if (screen === "youtrack") {
    return <YouTrackSettings
      workspaceId={workspaceId}
      status={status}
      languageTag={languageTag}
      russian={russian}
      canManage={canManage}
      onBack={() => open("catalog")}
      onStatusChange={refresh}
    />;
  }
  return (
    <div className={surface.root} data-testid="hooks-view" data-integration-workspace>
      <IntegrationCatalog
        russian={russian}
        copy={hooksCopy(russian)}
        configuration={configuration}
        status={status}
        statusFailed={statusFailed || configurationFailed}
        connectorState={connectors.state} connections={connectors.connections} projectId={projectId}
        onOpenConnector={open}
        onRefresh={refresh}
        onOpenYouTrack={() => open("youtrack")}
      />
    </div>
  );
}
