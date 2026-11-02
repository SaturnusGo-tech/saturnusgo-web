import type { YouTrackIntegrationStatus } from "../../../../application/integrations/getYouTrackIntegrationStatus";
import type { YouTrackConfiguration } from "../../../../youtrack/model/youtrack-settings";
import { isProvider, type Connection } from "../../../../connectors/model/connector-types";
import type { IntegrationUiStatus } from "../../shared/IntegrationStatusBadge";
import { INTEGRATIONS, type IntegrationDefinition, type IntegrationGroup } from "../integration-definitions";

export type CatalogFilter = "all" | "connected" | "attention" | "planned";
export type CatalogGroup = IntegrationGroup | "all";
export type CatalogEntry = { integration: IntegrationDefinition; status: IntegrationUiStatus };
export type CatalogSource = {
  showOthers?: boolean; showCodex: boolean; codexStatus: IntegrationUiStatus;
  codexCompanyStatus?: "active" | "inactive" | "not_activated" | null; swaggerStatus: IntegrationUiStatus;
  configuration: YouTrackConfiguration | null; status: YouTrackIntegrationStatus | null; statusFailed: boolean;
  connectorState: "loading" | "ready" | "error"; connections: readonly Connection[]; projectId: string;
};

export function catalogEntries(source: CatalogSource): CatalogEntry[] {
  return INTEGRATIONS.filter(integration => integration.id === "codex" ? source.showCodex : source.showOthers !== false)
    .map(integration => ({ integration, status: state(integration, source) }));
}

export function filterCatalog(entries: readonly CatalogEntry[], group: CatalogGroup, filter: CatalogFilter, query: string) {
  const search = query.trim().toLocaleLowerCase();
  return entries.filter(({ integration, status }) => (group === "all" || integration.group === group)
    && (filter === "all" || status === filter)
    && `${integration.name} ${integration.description.ru} ${integration.description.en}`.toLocaleLowerCase().includes(search));
}

function state(integration: IntegrationDefinition, source: CatalogSource): IntegrationUiStatus {
  if (integration.id === "codex") return source.codexStatus === "available" && source.codexCompanyStatus === "active" ? "connected" : source.codexStatus;
  if (integration.id === "swagger") return source.swaggerStatus;
  if (integration.id === "youtrack") {
    const { configuration, status, statusFailed } = source;
    if (!configuration) return status ? "connected" : statusFailed ? "attention" : "checking";
    if (configuration.source === "runtime" && configuration.enabled && configuration.tokenConfigured) return "connected";
    if (!configuration.enabled || configuration.connection.status === "unconfigured") return "available";
    return configuration.connection.status === "connected" ? "connected" : "attention";
  }
  if (!isProvider(integration.id)) return "planned";
  if (source.connectorState === "loading") return "checking";
  if (source.connectorState === "error") return "attention";
  return source.connections.some(connection => connection.provider === integration.id && connection.projectId === source.projectId && connection.enabled)
    ? "connected" : "available";
}
