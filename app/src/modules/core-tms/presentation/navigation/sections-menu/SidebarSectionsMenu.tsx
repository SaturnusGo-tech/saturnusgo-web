import { useId, type RefObject } from "react";
import { Grid2X2, Pin, X } from "lucide-react";
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
  preferences: SidebarPreferences; onMode: (mode: SidebarPreferences["mode"]) => void;
  onTogglePinned: (id: SidebarNavigationId) => void; onNavigate: (id: SidebarNavigationId) => void; disabled: boolean;
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
        data-testid="nav-all-sections" onClick={openSections}><Grid2X2 size={18} aria-hidden="true"/><span>{title}</span></button>
    </div>}
    {popup?.kind === "sections" && <div className={css.panel} ref={panel} id={id} popover="manual" role="dialog"
      aria-labelledby={`${id}-title`} data-testid="sidebar-sections-menu">
      <header className={css.header}><h2 id={`${id}-title`}>{title}</h2>
        <button type="button" className={css.close} onClick={close} aria-label={ru ? "Закрыть меню разделов" : "Close sections menu"}><X size={16} aria-hidden="true" /></button>
      </header>
      <fieldset className={css.modes}><legend>{ru ? "В боковом меню" : "Show in sidebar"}</legend>
        {(["all", "contextual"] as const).map(mode => <label key={mode}>
          <input type="radio" name={`${id}-mode`} value={mode} data-sidebar-mode={mode}
            checked={props.preferences.mode === mode} onChange={() => props.onMode(mode)} />
          <span>{mode === "all" ? (ru ? "Все разделы" : "All sections") : (ru ? "По контексту" : "Contextual")}</span>
        </label>)}
      </fieldset>
      <p className={css.hint}>{ru ? "В контексте: основные разделы, текущая группа и закреплённое." : "Contextual: core sections, current group and pinned links."}</p>
      <ul className={css.sections}>{available.map(view => {
        const label = t(labels[view]); const pinned = props.preferences.pinned.includes(view);
        return <li key={view} data-active={view === props.activeId || undefined}>
          <button type="button" className={css.navigate} data-sidebar-section={view} aria-current={view === props.activeId ? "page" : undefined}
            disabled={props.disabled && view !== "portfolios" && view !== "api"}
            onClick={() => { close(); props.onNavigate(view); }}>{label}</button>
          <button type="button" className={css.pin} data-sidebar-pin={view} aria-pressed={pinned}
            aria-label={`${pinned ? (ru ? "Открепить" : "Unpin") : (ru ? "Закрепить" : "Pin")} ${label}`}
            onClick={() => props.onTogglePinned(view)}><Pin size={14} aria-hidden="true" /></button>
        </li>;
      })}</ul>
    </div>}
  </div>;
}
