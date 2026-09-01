import {
  ChevronsLeft,
  ChevronsRight,
  Code2,
  FileBarChart,
  FolderKanban,
  LayoutDashboard,
  Link2,
  ListChecks,
  Network,
  PlayCircle,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import type { TmsMessageKey } from "../../localization/catalog/messages";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { View } from "../../state/types/workspace";
import shellStyles from "../workspace/tms-shell.module.css";
import { NavigationUtilityMenu } from "./NavigationUtilityMenu";

const navigationItems: Array<{
  id: View;
  labelKey: TmsMessageKey;
  icon: ReactNode;
}> = [
  { id: "dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "cases", labelKey: "nav.cases", icon: <FolderKanban size={20} /> },
  {
    id: "integrations",
    labelKey: "nav.integrations",
    icon: <Network size={20} />,
  },
  { id: "api", labelKey: "nav.apiTesting", icon: <Code2 size={20} /> },
  { id: "runs", labelKey: "nav.runs", icon: <PlayCircle size={20} /> },
  { id: "suites", labelKey: "nav.suites", icon: <ListChecks size={20} /> },
  { id: "hooks", labelKey: "nav.hooks", icon: <Link2 size={20} /> },
  { id: "reports", labelKey: "nav.reports", icon: <FileBarChart size={20} /> },
  { id: "config", labelKey: "nav.config", icon: <Settings size={20} /> },
];

export function Navigation({
  view,
  onChange,
  disabled,
  collapsed,
  onToggleCollapsed,
  onCreateCase,
  onCreateDefect,
  activeRunCount,
}: {
  view: View;
  onChange: (view: View) => void;
  disabled: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onCreateCase: () => void;
  onCreateDefect: () => void;
  activeRunCount: number;
}) {
  const { locale, t } = useTmsLocale();
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
          onClick={() => onChange("dashboard")}
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
        {navigationItems.map((item) => {
          const label = t(item.labelKey);
          const active = !disabled && view === item.id;
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
              onClick={() => onChange(item.id)}
              disabled={disabled}
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
        onCreateCase={onCreateCase}
        onCreateDefect={onCreateDefect}
        onOpenSettings={() => onChange("config")}
      />

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
