import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Grid2X2, Pin, X } from "lucide-react";
import type { TmsMessageKey } from "../../../localization/catalog/messages";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useAnchoredPopup } from "../../common/popup/useAnchoredPopup";
import { SIDEBAR_NAVIGATION_IDS, type SidebarNavigationId } from "../model/sidebar-navigation";
import type { SidebarPreferences } from "../model/sidebar-preferences";
import css from "./sidebar-sections-menu.module.css";

const labels: Record<SidebarNavigationId, TmsMessageKey> = {
  dashboard: "nav.dashboard", cases: "nav.cases", "shared-steps": "nav.sharedSteps", runs: "nav.runs", suites: "nav.suites",
  portfolios: "nav.portfolios", "custom-fields": "nav.customFields", api: "nav.apiTesting", hooks: "nav.hooks", reports: "nav.reports",
};
type Props = {
  collapsed: boolean; availableIds: readonly SidebarNavigationId[]; activeId: SidebarNavigationId | null;
  preferences: SidebarPreferences; onMode: (mode: SidebarPreferences["mode"]) => void;
  onTogglePinned: (id: SidebarNavigationId) => void; onNavigate: (id: SidebarNavigationId) => void; disabled: boolean;
};

export function SidebarSectionsMenu(props: Props) {
  const { locale, t } = useTmsLocale(); const ru = locale === "ru";
  const title = ru ? "Все разделы" : "All sections";
  const id = useId(); const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null); const panel = useRef<HTMLDivElement>(null);
  const dismiss = useCallback(() => setOpen(false), []);
  const visible = open;
  useAnchoredPopup(visible, false, root, trigger, panel, dismiss, 300);
  useEffect(() => { if (visible) panel.current?.querySelector<HTMLInputElement>("input:checked")?.focus({ preventScroll: true }); }, [visible]);
  const close = () => { dismiss(); trigger.current?.focus({ preventScroll: true }); };
  const available = SIDEBAR_NAVIGATION_IDS.filter(view => props.availableIds.includes(view));
  return <div className={css.root} ref={root} data-collapsed={props.collapsed || undefined} onKeyDown={event => {
    if (event.key === "Escape" && visible) { event.preventDefault(); event.stopPropagation(); close(); }
  }} onBlur={event => {
    if (event.relatedTarget && !root.current?.contains(event.relatedTarget as Node)) dismiss();
  }}>
    <button ref={trigger} className={css.trigger} type="button" data-testid="nav-all-sections" data-nav-label={title}
      aria-label={title} aria-haspopup="dialog" aria-expanded={visible}
      aria-controls={visible ? id : undefined} onClick={() => setOpen(value => !value)}>
      <Grid2X2 size={20} aria-hidden="true" /><span>{title}</span>
    </button>
    {visible && <div className={css.panel} ref={panel} id={id} popover="manual" role="dialog"
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
