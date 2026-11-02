"use client";
import { CodexDetail } from "../../codex-employee/presentation/setup/CodexDetail";
import { useCodexEmployee } from "../../codex-employee/application/state/useCodexEmployee";
import { createCodexEmployeeApi } from "../../codex-employee/data/http/codex-employee-api";

import { ApiSourceManager } from "../../api-sources/presentation/ApiSourceManager";
import { ApiTestingView } from "../api-testing/ApiTestingView";
import { useApiSourceList } from "../../api-sources/state/useApiSourceList";
import { companyViewAvailable } from "../../auth/managed/domain/features/company-features";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { transitionContent } from "../workspace/motion/transition/content-transition";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { isProvider } from "../../connectors/model/connector-types";
import { integrationScreen, type IntegrationScreen } from "./hooks-navigation";
import { IntegrationCatalog } from "./catalog/IntegrationCatalog";
import surface from "./hooks.module.css";
import { hooksCopy } from "./shared/hooks-copy";
import { YouTrackSettings } from "./youtrack/YouTrackSettings";

export function HooksView({ workspaceId, projectId, canManage, capabilities, connected }: { workspaceId: string; projectId: string; canManage: boolean; capabilities: readonly string[]; connected: boolean }) {
  const http = useTmsHttpClient();
  const { locale, languageTag } = useTmsLocale();
  const russian = locale === "ru";
  const [screen, setScreen] = useState<IntegrationScreen>(() => typeof window === "undefined" ? "catalog" : integrationScreen(window.location.search));
  const [status, setStatus] = useState<YouTrackIntegrationStatus | null>(null);
  const [configuration, setConfiguration] = useState<YouTrackConfiguration | null>(null);
  const [statusFailed, setStatusFailed] = useState(false);
  const [configurationFailed, setConfigurationFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const connectors = useWorkspaceConnectors();
  const session = useOptionalTmsSession();
  const codexApi = useMemo(() => createCodexEmployeeApi(http), [http]);
  const codex = useCodexEmployee(codexApi, session?.kind === "managed");
  const apiEnabled = companyViewAvailable("api", session?.companyCapabilities);
  const sources = useApiSourceList(workspaceId, { projectIds: [projectId] }, false, apiEnabled && screen === "catalog");
  const open = (target: IntegrationScreen) => transitionContent(() => {
    setScreen(target);
    const url = new URL(window.location.href);
    url.searchParams.delete("analysisId"); url.searchParams.delete("impact");
    if (target === "catalog") url.searchParams.delete("integration"); else url.searchParams.set("integration", target);
    window.history.pushState(window.history.state, "", url);
  });
  useEffect(() => {
    const restore = () => {
      setScreen(integrationScreen(window.location.search));
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
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

  if (screen === "codex" && session?.kind === "managed") return <CodexDetail state={codex} locale={locale} onBack={() => open("catalog")} />;
  if (screen === "swagger") return canManage ? <ApiSourceManager key={workspaceId} workspaceId={workspaceId} projectId={projectId} onBack={() => open("catalog")} />
    : <ApiTestingView scope={{ workspaceId, projectId }} canManage={false} />;
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
        showCodex={session?.kind === "managed"} onOpenCodex={() => open("codex")}
        codexStatus={codex.loading ? "checking" : codex.error ? "attention" : codex.employee?.status === "active" ? "connected" : "available"}
        copy={hooksCopy(russian)}
        configuration={configuration}
        status={status}
        statusFailed={statusFailed || configurationFailed}
        swaggerStatus={!apiEnabled ? "available" : sources.loading ? "checking" : sources.error ? "attention" : sources.items.some(source => source.enabled) ? "connected" : "available"}
        connectorState={connectors.state} connections={connectors.connections} projectId={projectId}
        onOpenConnector={open}
        onRefresh={() => { refresh(); sources.refresh(); codex.refresh(); }}
        onOpenYouTrack={() => open("youtrack")}
      />
    </div>
  );
}
