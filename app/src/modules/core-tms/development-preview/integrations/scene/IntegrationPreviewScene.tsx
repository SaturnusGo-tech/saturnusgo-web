"use client";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { IntegrationId } from "../../../presentation/hooks/catalog/integration-definitions";
import { IntegrationPluginManager } from "../../../presentation/hooks/plugin-management/IntegrationPluginManager";
import { IntegrationButton } from "../../../presentation/common/integration-controls/button/IntegrationButton";
import { createIntegrationPreviewClient } from "../network/integration-preview-client";
import { integrationPreviewFetch } from "../network/integration-preview-fetch";
import { sampleWorkspace } from "../samples/youtrack-sample";
import css from "../integration-preview.module.css";
const providers: IntegrationId[] = ["youtrack", "jira", "linear", "trello", "github", "slack", "confluence", "swagger"];
const capabilities = ["integration:read", "integration:manage", "run:manage", "test_case:manage", "audit:read"];
export function IntegrationPreviewScene() {
  const query = new URLSearchParams(window.location.search);
  const [provider, setProvider] = useState<IntegrationId>(() => providers.find(id => id === query.get("provider")) ?? "youtrack");
  const [readonly, setReadonly] = useState(query.get("readonly") === "true"), [ready, setReady] = useState(false);
  const { locale, setLocale } = useTmsLocale(), { resolvedTheme, setTheme } = useTheme();
  const fixture = useMemo(() => createIntegrationPreviewClient(), []);
  useEffect(() => {
    const previous = window.fetch;
    const safe = integrationPreviewFetch(window.location.origin, fixture.fetch, previous);
    window.fetch = safe; setReady(true);
    return () => { if (window.fetch === safe) window.fetch = previous; };
  }, [fixture]);
  useEffect(() => { const value = query.get("theme"); if (value === "dark" || value === "light") setTheme(value); }, [setTheme]);
  const changeTheme = () => {
    const next = resolvedTheme === "dark" ? "light" : "dark", url = new URL(window.location.href);
    url.searchParams.set("theme", next); window.history.replaceState(window.history.state, "", url); setTheme(next);
  };
  return <div className={css.preview} data-falcon-workspace>
    <nav className={css.tools} aria-label="Local preview controls"><strong>Local sample · real changes disabled</strong>
      {providers.map(id => <IntegrationButton key={id} size="sm" variant="light" aria-pressed={provider === id} onPress={() => setProvider(id)}>{id}</IntegrationButton>)}
      <IntegrationButton size="sm" onPress={changeTheme}>{resolvedTheme === "dark" ? "Light" : "Dark"}</IntegrationButton>
      <IntegrationButton size="sm" onPress={() => setLocale(locale === "ru" ? "en" : "ru")}>{locale === "ru" ? "English" : "Русский"}</IntegrationButton>
      <IntegrationButton size="sm" aria-pressed={readonly} onPress={() => setReadonly(!readonly)}>Read only</IntegrationButton>
    </nav>
    {ready && <TmsSessionProvider value={{ kind: "managed", subject: "sample", label: "Sample QA", workspaceId: sampleWorkspace,
      workspaceRole: readonly ? "tester" : "workspace_admin", companyCapabilities: ["core", "integrations", "api_testing"], signOut: async () => {} }}>
      <TmsHttpClientProvider client={fixture.http}><div className={css.workspace} key={`${provider}:${readonly}`} onClickCapture={event => {
        if ((event.target as Element).closest("a")) { event.preventDefault(); event.stopPropagation(); }
      }}><IntegrationPluginManager key={`${provider}:${readonly}`} id={provider} workspaceId={sampleWorkspace} projectId="project-0"
        canManage={!readonly} capabilities={readonly ? ["integration:read"] : capabilities} connected ru={locale === "ru"}
        onBack={() => {}} onViewDetails={() => {}} requestSetup onUpdated={() => {}}/></div></TmsHttpClientProvider>
    </TmsSessionProvider>}
  </div>;
}
