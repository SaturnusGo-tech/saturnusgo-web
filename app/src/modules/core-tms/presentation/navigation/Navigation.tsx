import { ChevronsLeft } from "lucide-react";
import { useRef } from "react";
import { workspaceViewAllowed } from "../../auth/managed/domain/features/workspace-view-access";
import { useOptionalTmsSession } from "../../auth/presentation/session/TmsSessionContext";
import { companyViewAvailable } from "../../auth/managed/domain/features/company-features";
import { navigateWorkspace } from "../../state/navigation/browser/workspace-history";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import type { View } from "../../state/types/workspace";
import shellStyles from "../workspace/tms-shell.module.css";
import { NavigationUtilityMenu } from "./NavigationUtilityMenu";
import { NavigationProfile } from "../navigation-profile/NavigationProfile";
import { getSidebarNavigation, SIDEBAR_NAVIGATION_IDS } from "./model/sidebar-navigation";
import { useSidebarPreferences } from "./state/useSidebarPreferences";
import { NavigationGroups } from "./ui/NavigationGroups";
import { NavigationTooltip } from "./tooltip/NavigationTooltip";
import { SidebarSectionsMenu } from "./sections-menu/SidebarSectionsMenu";
import css from "./styles/sidebar-system.module.css";

export function Navigation({ view, onChange, disabled, connected, collapsed, onToggleCollapsed, workspaceId, activeRunCount, userCapabilities }: {
  view: View; onChange: (view: View) => void; disabled: boolean; collapsed: boolean;
  onToggleCollapsed: () => void; workspaceId: string; connected: boolean; activeRunCount: number; userCapabilities: readonly string[];
}) {
  const { t } = useTmsLocale();
  const session = useOptionalTmsSession();
  const root = useRef<HTMLElement>(null);
  const available = (candidate: View) => companyViewAvailable(candidate, session?.companyCapabilities) && workspaceViewAllowed(candidate, userCapabilities);
  const state = useSidebarPreferences(workspaceId, session?.subject);
  const navigation = getSidebarNavigation({ availableIds: SIDEBAR_NAVIGATION_IDS.filter(available), activeView: view, preferences: state.preferences });
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
  return <nav ref={root} id="tms-navigation" data-sidebar-system data-collapsed={collapsed} tabIndex={-1}
    className={`${shellStyles.navigation} ${collapsed ? shellStyles.navigationCollapsed : ""} ${css.system}`} aria-label={t("nav.ariaLabel")}>
    <div className={css.header}>
      <button type="button" className={css.brand} onClick={() => navigate(available("dashboard") ? "dashboard" : "cases")}
        aria-label={t("header.dashboardAria")}>
        <span className={css.mark} aria-hidden="true"/><span className={css.wordmark} aria-hidden="true">FALCON</span>
      </button>
    </div>
    <div className={css.scroll} data-sidebar-scroll>
      <NavigationGroups groups={navigation.groups} activeId={navigation.activeId} disabled={disabled} activeRunCount={activeRunCount} onNavigate={navigate}/>

    </div>
    <div className={css.footer}>
      <SidebarSectionsMenu sidebar={root} availableIds={navigation.availableIds} activeId={navigation.activeId}
        preferences={state.preferences} onMode={state.setMode} onTogglePinned={state.togglePinned} onNavigate={navigate} disabled={disabled}/>
      <NavigationUtilityMenu settingsActive={view === "config"} helpActive={view === "help"} connected={connected} subject={session?.subject ?? ''}
        workspaceId={workspaceId}
        onOpenSettings={() => onChange("config")} onOpenHelp={() => onChange("help")}/>
      <NavigationProfile collapsed={collapsed}/>
      <button type="button" className={`${css.item} ${css.collapse}`} onClick={onToggleCollapsed}
        aria-label={t(collapsed ? "nav.expandSidebar" : "nav.collapseSidebar")} aria-expanded={!collapsed}
        aria-controls="tms-navigation" data-nav-label={t(collapsed ? "nav.expandSidebar" : "nav.collapseSidebar")}>
        <span className={css.icon} aria-hidden="true"><ChevronsLeft size={20}/></span>
        <span className={css.label}>{t(collapsed ? "nav.expandSidebar" : "nav.collapseSidebar")}</span>
      </button>
    </div>
    <NavigationTooltip collapsed={collapsed} root={root}/>
  </nav>;
}
