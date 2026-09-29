import { settingsSections, type SettingsSection } from "./settings-sections";

export function readSettingsSection(href: string): SettingsSection {
  const query = new URL(href).searchParams;
  if (query.get("view") === "notifications") return "notifications";
  const value = query.get("settings");
  return query.get("view") === "config" && settingsSections.includes(value as SettingsSection) ? value as SettingsSection : "general";
}
export function settingsSectionLink(href: string, section: SettingsSection) {
  const url = new URL(href);
  for (const key of [...url.searchParams.keys()]) {
    if (key !== "workspaceId" && key !== "projectId") url.searchParams.delete(key);
  }
  url.searchParams.set("view", "config"); url.searchParams.set("settings", section); url.hash = "";
  return `${url.pathname}${url.search}`;
}

export const ENVIRONMENT_SETTINGS_OPEN = "falcon:environment-settings-open";
