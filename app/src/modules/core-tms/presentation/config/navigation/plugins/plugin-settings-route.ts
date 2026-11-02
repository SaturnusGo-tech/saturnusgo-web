import { settingsSectionLink } from "../settings-section-route";
import { isProvider } from "../../../../connectors/model/connector-types";
import type { IntegrationId } from "../../../hooks/catalog/integration-definitions";

export const manageablePlugin = (id: string): id is IntegrationId => id === "codex" || id === "youtrack" || isProvider(id);

export function readPluginSettingsRoute(href: string): IntegrationId | null {
  const query = new URL(href).searchParams;
  const id = query.get("plugin");
  return query.get("view") === "config" && query.get("settings") === "plugins" && id && manageablePlugin(id) ? id : null;
}

export function pluginSettingsLink(href: string, id: IntegrationId | null, connect = false) {
  const url = new URL(settingsSectionLink(href, "plugins"), href);
  if (id && manageablePlugin(id)) {
    url.searchParams.set("plugin", id);
    if (connect) url.searchParams.set("pluginSetup", "connect");
  }
  return `${url.pathname}${url.search}`;
}
