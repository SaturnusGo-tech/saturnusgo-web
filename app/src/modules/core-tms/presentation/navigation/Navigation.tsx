import { useRef } from "react";
import { ChevronsLeft } from "lucide-react";
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

export function Navigation({ view, onChange, disabled, collapsed, onToggleCollapsed, workspaceId, activeRunCount, userCapabilities }: {
  view: View; onChange: (view: View) => void; disabled: boolean; collapsed: boolean;
  onToggleCollapsed: () => void; workspaceId: string; activeRunCount: number; userCapabilities: readonly string[];
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
  const toggleLabel = t(collapsed ? "nav.expandSidebar" : "nav.collapseSidebar");
  return <nav ref={root} id="tms-navigation" data-sidebar-system data-collapsed={collapsed}
    className={`${shellStyles.navigation} ${collapsed ? shellStyles.navigationCollapsed : ""} ${css.system}`} aria-label={t("nav.ariaLabel")}>
    <div className={css.header}>
      <button type="button" className={css.brand} onClick={() => navigate(available("dashboard") ? "dashboard" : "cases")}
        aria-label={t("header.dashboardAria")}>
        <span className={css.mark} aria-hidden="true"/><span className={css.wordmark} aria-hidden="true">FALCON</span>
      </button>
      <button type="button" className={css.collapse} onClick={onToggleCollapsed} aria-label={toggleLabel}
        aria-expanded={!collapsed} data-nav-label={toggleLabel}><ChevronsLeft size={16} aria-hidden="true"/></button>
    </div>
    <div className={css.scroll} data-sidebar-scroll>
      <NavigationGroups groups={navigation.groups} activeId={navigation.activeId} disabled={disabled} activeRunCount={activeRunCount} onNavigate={navigate}/>

    </div>
    <div className={css.footer}>
      <div className={css.sectionsLauncher}>
      <SidebarSectionsMenu collapsed={collapsed} availableIds={navigation.availableIds} activeId={navigation.activeId}
        preferences={state.preferences} onMode={state.setMode} onTogglePinned={state.togglePinned} onNavigate={navigate} disabled={disabled}/>
      </div>
      <NavigationUtilityMenu disabled={disabled} settingsActive={!disabled && view === "config"} helpActive={view === "help"}
        notificationsActive={view === "notifications"} onOpenNotifications={() => onChange("notifications")} workspaceId={workspaceId}
        onOpenSettings={() => onChange("config")} onOpenHelp={() => onChange("help")}/>
      <NavigationProfile collapsed={collapsed}/>
    </div>
    <NavigationTooltip collapsed={collapsed} root={root}/>
  </nav>;
}
