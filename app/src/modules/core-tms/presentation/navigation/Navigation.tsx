import { useWorkspaceCapabilities } from "../../auth/spaces/capabilities/composition/useWorkspaceCapabilities";
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
import { SidebarSectionsMenu } from "./sections-menu/SidebarSectionsMenu";
import { RareNavigationMenu } from "./overflow/RareNavigationMenu";
import css from "./styles/sidebar-system.module.css";
import { useSidebarReveal } from "./reveal/useSidebarReveal";
import { NavigationTooltip } from "./tooltip/NavigationTooltip";

export function Navigation({ view, onChange, disabled, connected, collapsed, onCollapsedChange, workspaceId, activeRunCount, userCapabilities }: {
  view: View; onChange: (view: View) => void; disabled: boolean; collapsed: boolean;
  onCollapsedChange: (next: boolean) => void; workspaceId: string; connected: boolean; activeRunCount: number; userCapabilities: readonly string[];
}) {
  const { t, locale } = useTmsLocale();
  const session = useOptionalTmsSession();
  const metadata = useWorkspaceCapabilities(workspaceId, !!session);
  const codexAvailable = !!metadata.value;
  const root = useRef<HTMLElement>(null);
  const reveal = useSidebarReveal(root, collapsed, onCollapsedChange);
  const compact = !reveal.revealed;
  const available = (candidate: View) => companyViewAvailable(candidate, session?.companyCapabilities, codexAvailable) && workspaceViewAllowed(candidate, userCapabilities, codexAvailable);
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
  return <nav ref={root} id="tms-navigation" data-sidebar-system data-collapsed={compact} data-peek={reveal.revealed || undefined} tabIndex={-1}
    className={`${shellStyles.navigation} ${compact ? shellStyles.navigationCollapsed : ""} ${css.system}`} aria-label={t("nav.ariaLabel")}>
    <div className={css.header}>
      <button type="button" className={css.brand} onClick={() => navigate(available("dashboard") ? "dashboard" : "cases")}
        aria-label={t("header.dashboardAria")} data-nav-label={t("header.dashboardAria")}>
        <span className={css.mark} aria-hidden="true"/><span className={css.wordmark} aria-hidden="true">FALCON</span>
      </button>
    </div>
    <div className={css.scroll} data-sidebar-scroll>
      <NavigationGroups groups={navigation.groups} activeId={navigation.activeId} disabled={disabled} allowManagedHooks={codexAvailable} activeRunCount={activeRunCount} onNavigate={navigate}/>
      <RareNavigationMenu availableIds={navigation.availableIds} activeId={navigation.activeId} pinnedIds={navigation.pinnedIds}
        disabled={disabled} allowManagedHooks={codexAvailable} onNavigate={navigate} onTogglePinned={state.togglePinned}/>
    </div>
    <div className={css.footer}>
      <SidebarSectionsMenu sidebar={root} availableIds={navigation.availableIds} activeId={navigation.activeId}
        preferences={state.preferences} onTogglePinned={state.togglePinned} onNavigate={navigate} disabled={disabled} allowManagedHooks={codexAvailable}/>
      <NavigationUtilityMenu connected={connected} subject={session?.subject ?? ""} workspaceId={workspaceId}/>
      <NavigationProfile collapsed={compact} workspaceId={workspaceId} onOpenSettings={() => onChange("config")} onOpenHelp={() => onChange("help")}/>
    </div>
    <NavigationTooltip collapsed={collapsed && compact} root={root}/>
    <div className={css.resizeHandle} data-sidebar-resize role="separator" aria-orientation="vertical" tabIndex={0}
      aria-label={locale === "ru" ? "Ширина навигации" : "Navigation width"} aria-valuemin={52} aria-valuemax={240} aria-valuenow={compact ? 52 : 240}
      aria-valuetext={locale === "ru" ? (compact ? "Свёрнута" : "Развёрнута") : (compact ? "Collapsed" : "Expanded")}
      onKeyDown={event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault(); event.stopPropagation(); reveal.setCollapsed(event.key === "ArrowLeft" || event.key === "Home");
      }}/>
  </nav>;
}
