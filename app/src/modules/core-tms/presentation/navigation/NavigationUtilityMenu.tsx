import { Bell, CircleHelp, SlidersHorizontal } from "lucide-react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { SupportContact } from "../../support/composition/SupportContact";
import css from "./styles/sidebar-system.module.css";
export function NavigationUtilityMenu({workspaceId,disabled,settingsActive,helpActive,notificationsActive,onOpenNotifications,onOpenSettings,onOpenHelp}:{
 workspaceId:string;disabled:boolean;settingsActive:boolean;helpActive:boolean;notificationsActive:boolean;
 onOpenNotifications:()=>void;onOpenSettings:()=>void;onOpenHelp:()=>void;
}) {
 const {t}=useTmsLocale();
 return <div className={css.utilities}>
   <button type="button" className={css.item} data-active={settingsActive} onClick={onOpenSettings} disabled={disabled}
     aria-current={settingsActive ? "page" : undefined} aria-label={t("nav.config")} data-nav-label={t("nav.config")} data-testid="nav-config">
     <span className={css.icon} aria-hidden="true"><SlidersHorizontal size={20}/></span><span className={css.label}>{t("nav.config")}</span>
   </button>
   <button type="button" className={css.item} data-active={helpActive} onClick={onOpenHelp}
     aria-current={helpActive ? "page" : undefined} aria-label={t("nav.help")} data-nav-label={t("nav.help")} data-testid="nav-help-utility">
     <span className={css.icon} aria-hidden="true"><CircleHelp size={20}/></span><span className={css.label}>{t("nav.help")}</span>
   </button>
   <SupportContact workspaceId={workspaceId} navigationClasses={{button:css.item,icon:css.icon,label:css.label}}/>
   <button type="button" className={`${css.item} ${css.notifications}`} data-active={notificationsActive} onClick={onOpenNotifications}
     aria-current={notificationsActive ? "page" : undefined} aria-label={t("nav.notifications")} data-nav-label={t("nav.notifications")}>
     <span className={css.icon} aria-hidden="true"><Bell size={20}/></span><span className={css.label}>{t("nav.notifications")}</span>
   </button>
 </div>;
}
