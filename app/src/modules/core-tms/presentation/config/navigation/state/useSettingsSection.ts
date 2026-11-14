import { useEffect, useState } from "react";
import { HISTORY_CHANGE, navigateWorkspace, visitWorkspace } from "../../../../state/navigation/browser/workspace-history";
import type { SettingsSection } from "../settings-sections";
import { readSettingsSection, settingsSectionLink } from "../settings-section-route";

const projectSections: readonly SettingsSection[] = ["general", "environments", "test-data", "exchange"];

export function useSettingsSection(hasProject: boolean) {
  const [section, setSection] = useState<SettingsSection>(() => {
    if (typeof window === "undefined") return hasProject ? "general" : "appearance";
    const selected = readSettingsSection(window.location.href);
    return !hasProject && projectSections.includes(selected) ? "appearance" : selected;
  });
  useEffect(() => {
    const read = () => {
      const current = window.location.href, query = new URL(current).searchParams;
      const selected = readSettingsSection(current);
      setSection(!hasProject && projectSections.includes(selected) ? "appearance" : selected);
      if (query.get("view") === "notifications") navigateWorkspace(settingsSectionLink(current, "notifications"), true);
    };
    read(); window.addEventListener("popstate", read); window.addEventListener(HISTORY_CHANGE, read);
    return () => { window.removeEventListener("popstate", read); window.removeEventListener(HISTORY_CHANGE, read); };
  }, [hasProject]);
  return { section, select: (next: SettingsSection) => {
    const href = settingsSectionLink(window.location.href, next);
    return next === "test-data" ? visitWorkspace(href) : navigateWorkspace(href);
  } };
}
