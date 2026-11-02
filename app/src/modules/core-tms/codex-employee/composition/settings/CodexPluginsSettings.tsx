import { useEffect, useState } from "react";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { companyViewAvailable } from "../../../auth/managed/domain/features/company-features";
import { CompanyFeatureUnavailable } from "../../../auth/managed/presentation/permissions/CompanyFeatureUnavailable";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { HISTORY_CHANGE, visitWorkspace } from "../../../state/navigation/browser/workspace-history";
import { pluginSettingsLink, readPluginSettingsRoute } from "../../../presentation/config/navigation/plugins/plugin-settings-route";
import { usePluginCatalogState } from "../../../presentation/hooks/settings-state/usePluginCatalogState";
import { catalogEntries } from "../../../presentation/hooks/catalog/model/catalog-model";
import type { IntegrationId } from "../../../presentation/hooks/catalog/integration-definitions";
import { PluginsList } from "../../../presentation/hooks/plugin-list/PluginsList";
import { IntegrationPluginManager } from "../../../presentation/hooks/plugin-management/IntegrationPluginManager";
import { isProvider } from "../../../connectors/model/connector-types";
import { usePluginConnectionToggle } from "../../../connectors/application/plugin-settings/usePluginConnectionToggle";
import { canReuseYouTrackToken, draftFromConfiguration, validateYouTrackDraft } from "../../../youtrack/model/youtrack-settings";
import { useYouTrackPluginToggle } from "../../../youtrack/application/plugin-settings/useYouTrackPluginToggle";
import { useWorkspaceCodex } from "../workspace/useWorkspaceCodex";
import { CodexPluginManager } from "../../presentation/plugin-management/CodexPluginManager";

type Props = { workspaceId: string; projectId: string; canManage: boolean; capabilities: readonly string[]; connected: boolean };
export function CodexPluginsSettings({ workspaceId, projectId, canManage, capabilities, connected }: Props) {
  const session = useOptionalTmsSession(), { locale } = useTmsLocale(), ru = locale === "ru";
  const available = session?.kind === "managed", connectorAccess = canManage && !!projectId && companyViewAvailable("hooks", session?.companyCapabilities);
  const apiEnabled = canManage && !!projectId && companyViewAvailable("api", session?.companyCapabilities);
  const codex = useWorkspaceCodex(available), catalog = usePluginCatalogState(workspaceId, projectId, connectorAccess, apiEnabled);
  const toggle = usePluginConnectionToggle({ workspaceId, projectId, enabled: connectorAccess && connected });
  const youtrack = useYouTrackPluginToggle({ workspaceId, enabled: connectorAccess && connected, onUpdated: catalog.refresh });
  const [detail, setDetail] = useState(() => typeof window === "undefined" ? null : readPluginSettingsRoute(window.location.href));
  const [requestSetup, setRequestSetup] = useState(() => typeof window !== "undefined" && new URL(window.location.href).searchParams.get("pluginSetup") === "connect");
  useEffect(() => {
    const read = () => { const id = readPluginSettingsRoute(window.location.href); setDetail(id); setRequestSetup(!!id && new URL(window.location.href).searchParams.get("pluginSetup") === "connect"); };
    read(); window.addEventListener(HISTORY_CHANGE, read); window.addEventListener("popstate", read);
    return () => { window.removeEventListener(HISTORY_CHANGE, read); window.removeEventListener("popstate", read); };
  }, []);
  const open = (id: IntegrationId | null, connect = false) => visitWorkspace(pluginSettingsLink(window.location.href, id, connect));
  const browse = (id?: IntegrationId) => {
    const url = new URL(window.location.href); url.search = ""; url.hash = "";
    if (workspaceId) url.searchParams.set("workspaceId", workspaceId); if (projectId) url.searchParams.set("projectId", projectId);
    url.searchParams.set("view", "hooks"); if (id) url.searchParams.set("integration", id);
    visitWorkspace(url.toString());
  };
  const entries = catalogEntries({ ...catalog, showOthers: connectorAccess, showSwagger: apiEnabled, showCodex: available, projectId,
    codexStatus: codex.loading ? "checking" : codex.error ? "attention" : "available", codexCompanyStatus: codex.employee?.status });
  const change = (id: IntegrationId, next: boolean) => {
    if (id === "codex") { if (next) open(id, true); else void codex.deactivate(); }
    else if (id === "youtrack") { const config = catalog.configuration; if (!config?.baseUrl || !config.tokenConfigured || config.source !== "workspace" || config.configurationVersion !== 2 || validateYouTrackDraft(draftFromConfiguration(config), canReuseYouTrackToken(config, config.baseUrl))) open(id, true); else void youtrack.toggle(next); }
    else if (isProvider(id) && id !== "swagger") {
      if (!catalog.connections.some(connection => connection.provider === id && connection.projectId === projectId)) open(id, true);
      else void toggle.toggle(id, next);
    } else open(id, true);
  };
  if (detail === "codex" && available) return <CodexPluginManager key={`${session.subject}:${workspaceId}`} requestSetup={requestSetup} state={codex} locale={locale} onBack={() => open(null)} onViewDetails={() => browse("codex")} />;
  const githubReview = detail === "github" && typeof window !== "undefined" && (new URL(window.location.href).searchParams.get("impact") === "1" || new URL(window.location.href).searchParams.has("analysisId"));
  if (detail) return (detail === "swagger" ? apiEnabled : connectorAccess) ? <IntegrationPluginManager key={`${workspaceId}:${projectId}:${detail}`} id={detail}
    workspaceId={workspaceId} projectId={projectId} canManage={canManage} capabilities={capabilities} connected={connected} ru={ru} onUpdated={catalog.refresh} requestSetup={requestSetup || githubReview} onBack={() => open(null)} onViewDetails={() => browse(detail)} />
    : <CompanyFeatureUnavailable onReturn={() => open(null)} />;
  return <PluginsList entries={entries} codex={codex} ru={ru} canManage={connectorAccess && connected} pending={!!toggle.pending || youtrack.pending}
    error={toggle.error ?? youtrack.error} onManage={open} onBrowse={() => browse()} onToggle={change} />;
}
