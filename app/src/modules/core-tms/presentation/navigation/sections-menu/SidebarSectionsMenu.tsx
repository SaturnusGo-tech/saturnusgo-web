import { workspaceViewDisabledWithoutProject } from "../../../auth/managed/domain/features/workspace-view-access";
import { useId, type RefObject } from "react";
import { Grid, Pin, X } from "@openai/apps-sdk-ui/components/Icon";
import type { TmsMessageKey } from "../../../localization/catalog/messages";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useSidebarSectionsPopup } from "./useSidebarSectionsPopup";
import { SIDEBAR_NAVIGATION_IDS, type SidebarNavigationId } from "../model/sidebar-navigation";
import type { SidebarPreferences } from "../model/sidebar-preferences";
import css from "./sidebar-sections-menu.module.css";

const labels: Record<SidebarNavigationId, TmsMessageKey> = {
  dashboard: "nav.dashboard", cases: "nav.cases", "shared-steps": "nav.sharedSteps", runs: "nav.runs", suites: "nav.suites",
  portfolios: "nav.portfolios", "custom-fields": "nav.customFields", api: "nav.apiTesting", hooks: "nav.hooks", reports: "nav.reports",
};
type Props = {
  sidebar: RefObject<HTMLElement | null>; availableIds: readonly SidebarNavigationId[]; activeId: SidebarNavigationId | null;
  preferences: SidebarPreferences;
  onTogglePinned: (id: SidebarNavigationId) => void; onNavigate: (id: SidebarNavigationId) => void; disabled: boolean; allowManagedHooks?: boolean;
};

export function SidebarSectionsMenu(props: Props) {
  const { locale, t } = useTmsLocale(); const ru = locale === "ru";
  const title = ru ? "Все разделы" : "All sections";
  const id = useId();
  const { popup, root, panel, close, dismiss, openSections } = useSidebarSectionsPopup(props.sidebar);
  const available = SIDEBAR_NAVIGATION_IDS.filter(view => props.availableIds.includes(view));
  return <div className={css.root} ref={root} onKeyDown={event => {
    if (event.key === "Escape" && popup) { event.preventDefault(); event.stopPropagation(); close(); }
  }} onBlur={event => {
    if (event.relatedTarget && !root.current?.contains(event.relatedTarget as Node)) dismiss();
  }}>
    {popup?.kind === "context" && <div className={`${css.panel} ${css.context}`} ref={panel} popover="manual"
      role="menu" aria-label={title} data-testid="sidebar-context-menu" onKeyDown={event => {
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
          event.preventDefault(); panel.current?.querySelector<HTMLButtonElement>("button")?.focus();
        }
      }}>
      <button className={css.contextAction} type="button" role="menuitem" aria-haspopup="dialog"
        data-testid="nav-all-sections" onClick={openSections}><Grid width={20} height={20} aria-hidden="true"/><span>{title}</span></button>
    </div>}
    {popup?.kind === "sections" && <div className={css.panel} ref={panel} id={id} popover="manual" role="dialog"
      aria-labelledby={`${id}-title`} data-testid="sidebar-sections-menu">
      <header className={css.header}><h2 id={`${id}-title`}>{title}</h2>
        <button type="button" className={css.close} onClick={close} aria-label={ru ? "Закрыть меню разделов" : "Close sections menu"}><X width={16} height={16} aria-hidden="true" /></button>
      </header>
      <p className={css.hint}>{ru ? "Закрепите нужные разделы в боковом меню." : "Pin the sections you use in the sidebar."}</p>
      <ul className={css.sections}>{available.map(view => {
        const label = t(labels[view]); const pinned = props.preferences.pinned.includes(view);
        return <li key={view} data-active={view === props.activeId || undefined}>
          <button type="button" className={css.navigate} data-sidebar-section={view} aria-current={view === props.activeId ? "page" : undefined}
            disabled={workspaceViewDisabledWithoutProject(view, props.disabled, props.allowManagedHooks ?? false)}
            onClick={() => { close(); props.onNavigate(view); }}>{label}</button>
          <button type="button" className={css.pin} data-sidebar-pin={view} aria-pressed={pinned}
            aria-label={`${pinned ? (ru ? "Открепить" : "Unpin") : (ru ? "Закрепить" : "Pin")} ${label}`}
            onClick={() => props.onTogglePinned(view)}><Pin width={16} height={16} aria-hidden="true" /></button>
        </li>;
      })}</ul>
    </div>}
  </div>;
}
