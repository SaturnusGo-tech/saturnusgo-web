import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { SidebarGroupId, SidebarNavigationId } from "../model/sidebar-navigation";
import { sidebarCatalog, sidebarGroupLabels } from "./sidebar-catalog";
import css from "../styles/sidebar-system.module.css";

export function NavigationGroups({ groups, activeId, disabled, activeRunCount, onNavigate }: {
  groups: readonly { id: SidebarGroupId; ids: readonly SidebarNavigationId[] }[];
  activeId: SidebarNavigationId | null; disabled: boolean; activeRunCount: number;
  onNavigate: (id: SidebarNavigationId) => void;
}) {
  const { locale, t } = useTmsLocale();
  return <>{groups.map(group => <section key={group.id} className={css.group} aria-labelledby={`sidebar-${group.id}`}>
    <h2 id={`sidebar-${group.id}`} className={css.heading}>{sidebarGroupLabels[group.id][locale === "ru" ? "ru" : "en"]}</h2>
    {group.ids.map(id => {
      const item = sidebarCatalog[id]; const Icon = item.icon; const label = t(item.labelKey);
      const unavailable = disabled && id !== "portfolios" && id !== "api";
      const active = activeId === id && !unavailable;
      const running = id === "runs" && activeRunCount > 0;
      return <button key={id} type="button" className={css.item} data-active={active}
        onClick={() => onNavigate(id)} disabled={unavailable} data-testid={`nav-${id}`}
        data-nav-label={label} aria-current={active ? "page" : undefined}
        aria-label={running ? `${label}, ${activeRunCount} ${locale === "ru" ? "активных" : "active"}` : label}>
        <span className={css.icon} aria-hidden="true"><Icon size={20} strokeWidth={1.7}/>{running && <span className={css.dot}/>}</span>
        <span className={css.label}>{label}</span>
      </button>;
    })}
  </section>)}</>;
}
