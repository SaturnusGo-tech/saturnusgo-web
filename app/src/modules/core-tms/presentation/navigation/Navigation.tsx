import { workspaceViewAllowed } from "../../auth/managed/domain/features/workspace-view-access";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { companyViewAvailable } from "../../auth/managed/domain/features/company-features";
import { navigateWorkspace } from "../../state/navigation/browser/workspace-history";
import {
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Braces,
  ChartNoAxesCombined,
  Files,
  PanelsTopLeft,
  BriefcaseBusiness,
  Webhook,
  Layers,
  Blocks,
  Play,
  SlidersHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";
import type { TmsMessageKey } from "../../localization/catalog/messages";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { View } from "../../state/types/workspace";
import shellStyles from "../workspace/tms-shell.module.css";
import { NavigationUtilityMenu } from "./NavigationUtilityMenu";
import { NavigationProfile } from "../navigation-profile/NavigationProfile";

const navigationItems: Array<{
  id: View;
  labelKey: TmsMessageKey;
  icon: ReactNode;
}> = [
  { id: "dashboard", labelKey: "nav.dashboard", icon: <PanelsTopLeft size={20} /> },
  { id: "portfolios", labelKey: "nav.portfolios", icon: <BriefcaseBusiness size={20} /> },
  { id: "cases", labelKey: "nav.cases", icon: <Files size={20} /> },
  { id: "shared-steps", labelKey: "nav.sharedSteps", icon: <Blocks size={20} /> },
  { id: "api", labelKey: "nav.apiTesting", icon: <Braces size={20} /> },
  { id: "runs", labelKey: "nav.runs", icon: <Play size={20} /> },
  { id: "suites", labelKey: "nav.suites", icon: <Layers size={20} /> },
  { id: "hooks", labelKey: "nav.hooks", icon: <Webhook size={20} /> },
  { id: "reports", labelKey: "nav.reports", icon: <ChartNoAxesCombined size={20} /> },
  { id: "config", labelKey: "nav.config", icon: <SlidersHorizontal size={20} /> },
  { id: "help", labelKey: "nav.help", icon: <CircleHelp size={20} /> },
];

export function Navigation({
  view,
  onChange,
  disabled,
  collapsed,
  onToggleCollapsed,
  workspaceId,
  activeRunCount,
  userCapabilities,
}: {
  view: View;
  onChange: (view: View) => void;
  disabled: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  workspaceId: string;
  activeRunCount: number;
  userCapabilities: readonly string[];
}) {
  const { locale, t } = useTmsLocale();
  const session = useOptionalTmsSession();
  const available = (candidate: View) => companyViewAvailable(candidate, session?.companyCapabilities) && workspaceViewAllowed(candidate, userCapabilities);
  const navigate = (next: View) => {
    if (next === "suites" && view === "suites" && window.location.search.includes("suiteId=")) {
      const url = new URL(window.location.href); url.searchParams.delete("suiteId");
      navigateWorkspace(url.href); window.dispatchEvent(new PopStateEvent("popstate"));
    }
    if (next === "dashboard" && view === "dashboard" && window.location.search.includes("dashboardDetail=")) {
      const url = new URL(window.location.href); url.searchParams.delete("dashboardDetail");
      navigateWorkspace(url.href); window.dispatchEvent(new PopStateEvent("popstate"));
    }
    if (next === "portfolios" && view === "portfolios") {
      const url = new URL(window.location.href); url.searchParams.delete("portfolioId"); url.searchParams.delete("catalogProjectId"); navigateWorkspace(url.href);
    }
    onChange(next);
  };
  return (
    <nav
      id="tms-navigation"
      className={`${shellStyles.navigation} ${collapsed ? shellStyles.navigationCollapsed : ""}`}
      aria-label={t("nav.ariaLabel")}
    >
      <div className={shellStyles.brandArea}>
        <button
          type="button"
          className={shellStyles.brandButton}
          onClick={() => navigate(available("dashboard") ? "dashboard" : "cases")}
          aria-label={t("header.dashboardAria")}
          title={t("header.dashboardAria")}
        >
          <span className={shellStyles.tessiqMark} aria-hidden="true" />
          <span className={shellStyles.tessiqWordmark} aria-hidden="true">
            FALCON
          </span>
        </button>
      </div>

      <div className={shellStyles.navigationItems}>
        {navigationItems.filter((item) => available(item.id)).map((item) => {
          const label = t(item.labelKey);
          const active = (!disabled || item.id === "help" || item.id === "portfolios") && (view === item.id || view === "imports" && item.id === "cases");
          const runActive = item.id === "runs" && activeRunCount > 0;
          const accessibleLabel = runActive
            ? `${label}, ${activeRunCount} ${locale === "ru" ? "активных" : "active"}`
            : label;

          return (
            <button
              key={item.id}
              type="button"
              className={`${shellStyles.navigationItem} ${
                active ? shellStyles.navigationItemActive : ""
              }`}
              onClick={() => navigate(item.id)}
              disabled={disabled && item.id !== "help" && item.id !== "portfolios" && item.id !== "api"}
              aria-label={accessibleLabel}
              aria-current={active ? "page" : undefined}
              title={collapsed ? label : undefined}
              data-testid={`nav-${item.id}`}
            >
              <span className={shellStyles.navigationIcon} aria-hidden="true">
                {item.icon}
                {runActive && <span className={shellStyles.activeRunDot} />}
              </span>
              <span className={shellStyles.navigationLabel}>{label}</span>
            </button>
          );
        })}
      </div>

      <NavigationUtilityMenu
        disabled={disabled}
        settingsActive={!disabled && view === "config"}
        helpActive={view === "help"}
        notificationsActive={view === "notifications"}
        onOpenNotifications={() => onChange("notifications")}
        workspaceId={workspaceId}
        onOpenSettings={() => onChange("config")}
        onOpenHelp={() => onChange("help")}
      />

      <NavigationProfile collapsed={collapsed} />

      <button
        type="button"
        className={shellStyles.navigationToggle}
        onClick={onToggleCollapsed}
        aria-label={t(collapsed ? "nav.expandSidebar" : "nav.collapseSidebar")}
        aria-expanded={!collapsed}
        title={t(collapsed ? "nav.expandSidebar" : "nav.collapseSidebar")}
      >
        <span className={shellStyles.navigationIcon} aria-hidden="true">
          {collapsed ? <ChevronsRight size={19} /> : <ChevronsLeft size={19} />}
        </span>
        <span className={shellStyles.navigationLabel}>
          {t(collapsed ? "nav.expandSidebarShort" : "nav.collapseSidebarShort")}
        </span>
      </button>
    </nav>
  );
}
