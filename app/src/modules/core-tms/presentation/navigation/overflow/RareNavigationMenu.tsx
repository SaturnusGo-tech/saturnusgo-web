import { DotsHorizontal, Pin, PinFilled } from "@openai/apps-sdk-ui/components/Icon";
import { useId } from "react";
import { createPortal } from "react-dom";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { workspaceViewDisabledWithoutProject } from "../../../auth/managed/domain/features/workspace-view-access";
import { RARE_SIDEBAR_IDS, type SidebarNavigationId } from "../model/sidebar-navigation";
import { sidebarCatalog } from "../ui/sidebar-catalog";
import { useRailPopup } from "../popup/useRailPopup";
import nav from "../styles/sidebar-system.module.css";
import css from "./rare-navigation.module.css";

type Props = {
  availableIds: readonly SidebarNavigationId[]; activeId: SidebarNavigationId | null; pinnedIds: readonly SidebarNavigationId[];
  disabled: boolean; allowManagedHooks: boolean;
  onNavigate(id: SidebarNavigationId): void; onTogglePinned(id: SidebarNavigationId): void;
};

export function RareNavigationMenu(props: Props) {
  const { locale, t } = useTmsLocale(), ru = locale === "ru", popup = useRailPopup(), id = useId();
  const available = RARE_SIDEBAR_IDS.filter(view => props.availableIds.includes(view));
  const label = ru ? "Ещё разделы" : "More sections";
  if (!available.length) return null;
  return <div ref={popup.root} className={css.root} onPointerEnter={event => { if (event.pointerType !== "touch" && event.currentTarget.contains(event.target as Node)) popup.openHover(); }} onPointerLeave={popup.leave}>
    <button ref={popup.trigger} type="button" className={nav.item} data-active={popup.open || (props.activeId !== null && available.includes(props.activeId) && !props.pinnedIds.includes(props.activeId))}
      aria-haspopup="menu" aria-expanded={popup.open} aria-controls={popup.open ? id : undefined} aria-label={label}
      data-testid="nav-more" onClick={popup.toggle} onKeyDown={popup.triggerKeyDown}>
      <span className={nav.icon} aria-hidden="true"><DotsHorizontal width={24} height={24}/></span><span className={nav.label}>{label}</span>
    </button>
    {popup.open && typeof document !== "undefined" && createPortal(<div ref={popup.panel} id={id} className={css.panel}
      role="menu" aria-label={label} style={popup.position} onPointerEnter={popup.cancelClose} onPointerLeave={popup.leave}
      onKeyDown={popup.panelKeyDown} onBlur={event => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node) && !popup.root.current?.contains(event.relatedTarget as Node)) popup.dismiss();
      }}>
      {available.map(view => {
        const item = sidebarCatalog[view], Icon = item.icon, title = t(item.labelKey), pinned = props.pinnedIds.includes(view);
        const PinIcon = pinned ? PinFilled : Pin;
        return <div key={view} className={css.row} data-active={view === props.activeId}>
          <button role="menuitem" type="button" className={css.route} data-rare-section={view}
            aria-current={view === props.activeId ? "page" : undefined}
            disabled={workspaceViewDisabledWithoutProject(view, props.disabled, props.allowManagedHooks)}
            onClick={() => { popup.dismiss(); props.onNavigate(view); }}>
            <Icon width={20} height={20} aria-hidden="true"/><span>{title}</span>
          </button>
          <button role="menuitemcheckbox" type="button" className={css.pin} data-rare-pin={view} aria-checked={pinned} aria-pressed={pinned}
            aria-label={`${pinned ? (ru ? "Открепить" : "Unpin") : (ru ? "Закрепить" : "Pin")} ${title}`}
            onClick={() => props.onTogglePinned(view)}><PinIcon width={16} height={16} aria-hidden="true"/></button>
        </div>;
      })}
    </div>, document.body)}
  </div>;
}
