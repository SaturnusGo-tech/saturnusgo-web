import { Braces, ChartNoAxesCombined, Files, PanelsTopLeft, BriefcaseBusiness, Webhook, Layers, Blocks, Play, TextCursorInput } from "lucide-react";
import type { TmsMessageKey } from "../../../localization/catalog/messages";
import type { SidebarGroupId, SidebarNavigationId } from "../model/sidebar-navigation";

export const sidebarCatalog = {
  dashboard: { labelKey: "nav.dashboard", icon: PanelsTopLeft },
  cases: { labelKey: "nav.cases", icon: Files },
  "shared-steps": { labelKey: "nav.sharedSteps", icon: Blocks },
  runs: { labelKey: "nav.runs", icon: Play },
  suites: { labelKey: "nav.suites", icon: Layers },
  portfolios: { labelKey: "nav.portfolios", icon: BriefcaseBusiness },
  "custom-fields": { labelKey: "nav.customFields", icon: TextCursorInput },
  api: { labelKey: "nav.apiTesting", icon: Braces },
  hooks: { labelKey: "nav.hooks", icon: Webhook },
  reports: { labelKey: "nav.reports", icon: ChartNoAxesCombined },
} satisfies Record<SidebarNavigationId, { labelKey: TmsMessageKey; icon: typeof Files }>;

export const sidebarGroupLabels: Record<SidebarGroupId, { en: string; ru: string }> = {
  overview: { en: "Overview", ru: "Обзор" },
  testing: { en: "Testing", ru: "Тестирование" },
  management: { en: "Management", ru: "Управление" },
  insights: { en: "Insights", ru: "Аналитика" },
};
