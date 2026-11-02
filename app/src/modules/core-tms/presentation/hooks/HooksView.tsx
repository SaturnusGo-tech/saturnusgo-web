"use client";
import { visitWorkspace } from "../../state/navigation/browser/workspace-history";
import { pluginSettingsLink } from "../config/navigation/plugins/plugin-settings-route";
import { CompanyFeatureUnavailable } from "../../auth/managed/presentation/permissions/CompanyFeatureUnavailable";
import { CodexDetail } from "../../codex-employee/presentation/setup/CodexDetail";
import { useWorkspaceCodex } from "../../codex-employee/composition/workspace/useWorkspaceCodex";

import { IntegrationPluginDetail } from "./plugin-detail/IntegrationPluginDetail";
import { usePluginCatalogState } from "./settings-state/usePluginCatalogState";
import { catalogEntries } from "./catalog/model/catalog-model";
import { companyViewAvailable } from "../../auth/managed/domain/features/company-features";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { transitionContent } from "../workspace/motion/transition/content-transition";
import { useEffect, useState } from "react";

import { integrationScreen, type IntegrationScreen } from "./hooks-navigation";
import { IntegrationCatalog } from "./catalog/IntegrationCatalog";
import surface from "./hooks.module.css";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { hooksCopy } from "./shared/hooks-copy";

export function HooksView({ workspaceId, projectId, canManage, capabilities, connected }: { workspaceId: string; projectId: string; canManage: boolean; capabilities: readonly string[]; connected: boolean }) {
  const { locale } = useTmsLocale();
  const russian = locale === "ru";
  const [screen, setScreen] = useState<IntegrationScreen>(() => typeof window === "undefined" ? "catalog" : integrationScreen(window.location.search));
  const session = useOptionalTmsSession();
  const codex = useWorkspaceCodex(session?.kind === "managed");
  const connectorAccess = canManage && companyViewAvailable("hooks", session?.companyCapabilities);
  const apiEnabled = canManage && !!projectId && companyViewAvailable("api", session?.companyCapabilities);
  const catalog = usePluginCatalogState(workspaceId, projectId, connectorAccess, apiEnabled);
  const codexStatus = codex.loading ? "checking" : codex.error ? "attention" : "available";
  const entries = catalogEntries({ ...catalog, showOthers: connectorAccess, showSwagger: apiEnabled, showCodex: session?.kind === "managed", codexStatus, codexCompanyStatus: codex.employee?.status, projectId });
  const manage = (id: Exclude<IntegrationScreen, "catalog">) => {
    const target = new URL(pluginSettingsLink(window.location.href, id, id === "github" && (new URL(window.location.href).searchParams.get("impact") === "1" || new URL(window.location.href).searchParams.has("analysisId"))), window.location.href);
    if (id === "github") for (const key of ["impact", "analysisId"]) { const value = new URL(window.location.href).searchParams.get(key); if (value) target.searchParams.set(key, value); }
    visitWorkspace(target.toString());
  };
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
  useEffect(() => {
    if (screen === "github" && connectorAccess && (new URL(window.location.href).searchParams.get("impact") === "1" || new URL(window.location.href).searchParams.has("analysisId"))) manage("github");
  }, [screen, connectorAccess]);
  if (screen === "codex" && session?.kind === "managed") return <CodexDetail state={codex} locale={locale} onBack={() => open("catalog")} accountKey={session.subject ?? workspaceId} onManage={() => manage("codex")} />;
  if (screen !== "catalog" && (screen === "swagger" ? !apiEnabled : !connectorAccess)) return <CompanyFeatureUnavailable onReturn={() => open("catalog")} />;
  if (screen !== "catalog") return <IntegrationPluginDetail key={`${workspaceId}:${projectId}:${screen}`} id={screen} ru={russian}
    status={entries.find(entry => entry.integration.id === screen)?.status ?? "available"} accountKey={session?.subject ?? workspaceId}
    scopeKey={JSON.stringify([workspaceId, projectId])} disabled={!connected} onBack={() => open("catalog")} onManage={() => manage(screen)} />;
  return (
    <div className={surface.root} data-testid="hooks-view" data-integration-workspace>
      <IntegrationCatalog
        showOthers={connectorAccess} showSwagger={apiEnabled} russian={russian}
        showCodex={session?.kind === "managed"} onOpenCodex={() => open("codex")}
        codexStatus={codexStatus} codexCompanyStatus={codex.employee?.status}
        copy={hooksCopy(russian)}
        configuration={catalog.configuration}
        status={catalog.status}
        statusFailed={catalog.statusFailed}
        swaggerStatus={catalog.swaggerStatus}
        connectorState={catalog.connectorState} connections={catalog.connections} projectId={projectId}
        onOpenConnector={open}
        onRefresh={() => { if (connectorAccess || apiEnabled) catalog.refresh(); codex.refresh(); }}
        onOpenYouTrack={() => open("youtrack")}
      />
    </div>
  );
}
