import { useEffect, useState } from "react";
import { HISTORY_CHANGE, navigateWorkspace } from "../../../../state/navigation/browser/workspace-history";
import type { SettingsSection } from "../settings-sections";
import { readSettingsSection, settingsSectionLink } from "../settings-section-route";

export function useSettingsSection(hasProject: boolean) {
  const [section, setSection] = useState<SettingsSection>(hasProject ? "general" : "appearance");
  useEffect(() => {
    const read = () => {
      const current = window.location.href, query = new URL(current).searchParams;
      const selected = readSettingsSection(current);
      setSection(!hasProject && ["general", "environments", "exchange"].includes(selected) ? "appearance" : selected);
      if (query.get("view") === "notifications") navigateWorkspace(settingsSectionLink(current, "notifications"), true);
    };
    read(); window.addEventListener("popstate", read); window.addEventListener(HISTORY_CHANGE, read);
    return () => { window.removeEventListener("popstate", read); window.removeEventListener(HISTORY_CHANGE, read); };
  }, [hasProject]);
  return { section, select: (next: SettingsSection) => navigateWorkspace(settingsSectionLink(window.location.href, next)) };
}
