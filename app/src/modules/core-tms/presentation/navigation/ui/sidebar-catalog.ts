import { BarChart, Batches, BookOpen, CodeSquareSlash, ConnectApps, Folders, Home, Play, Stack, SuitcaseWorkBusiness, Text } from "@openai/apps-sdk-ui/components/Icon";
import type { ComponentType, SVGProps } from "react";
import { Database, Paperclip } from "lucide-react";
import type { TmsMessageKey } from "../../../localization/catalog/messages";
import type { SidebarGroupId, SidebarNavigationId } from "../model/sidebar-navigation";

export const sidebarCatalog = {
  dashboard: { labelKey: "nav.dashboard", icon: Home },
  cases: { labelKey: "nav.cases", icon: SuitcaseWorkBusiness },
  "product-docs": { labelKey: "nav.productDocs", icon: BookOpen },
  "shared-steps": { labelKey: "nav.sharedSteps", icon: Batches },
  "test-data": { labelKey: "nav.testData", icon: Database },
  runs: { labelKey: "nav.runs", icon: Play },
  suites: { labelKey: "nav.suites", icon: Stack },
  portfolios: { labelKey: "nav.portfolios", icon: Folders },
  "custom-fields": { labelKey: "nav.customFields", icon: Text },
  api: { labelKey: "nav.apiTesting", icon: CodeSquareSlash },
  hooks: { labelKey: "nav.hooks", icon: ConnectApps },
  files: { labelKey: "nav.files", icon: Paperclip },
  reports: { labelKey: "nav.reports", icon: BarChart },
} satisfies Record<SidebarNavigationId, { labelKey: TmsMessageKey; icon: ComponentType<SVGProps<SVGSVGElement>> }>;

export const sidebarGroupLabels: Record<SidebarGroupId, { en: string; ru: string }> = {
  overview: { en: "Overview", ru: "Обзор" },
  testing: { en: "Testing", ru: "Тестирование" },
  management: { en: "Management", ru: "Управление" },
  insights: { en: "Insights", ru: "Аналитика" },
};
