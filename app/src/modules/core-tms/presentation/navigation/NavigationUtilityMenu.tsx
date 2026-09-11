import { Bell, CircleHelp, Settings } from "lucide-react";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { SupportContact } from "../../support/composition/SupportContact";
import shellStyles from "../workspace/tms-shell.module.css";
export function NavigationUtilityMenu({workspaceId,disabled,settingsActive,helpActive,notificationsActive,onOpenNotifications,onOpenSettings,onOpenHelp}:{
 workspaceId:string;disabled:boolean;settingsActive:boolean;helpActive:boolean;notificationsActive:boolean;
 onOpenNotifications:()=>void;onOpenSettings:()=>void;onOpenHelp:()=>void;
}) {
 const {t}=useTmsLocale();
 return <div className={shellStyles.navigationUtilities}>
      <button
        type="button"
        className={`${shellStyles.navigationUtilityButton} ${settingsActive ? shellStyles.navigationUtilityButtonActive : ""}`}
        onClick={onOpenSettings}
        disabled={disabled}
        aria-current={settingsActive ? "page" : undefined}
      >
        <span className={shellStyles.navigationIcon} aria-hidden="true"><Settings size={20} /></span>
        <span className={shellStyles.navigationLabel}>{t("nav.config")}</span>
      </button>
      <button type="button" className={`${shellStyles.navigationUtilityButton} ${helpActive ? shellStyles.navigationUtilityButtonActive : ""}`}
        onClick={onOpenHelp} aria-current={helpActive ? "page" : undefined} title={t("nav.help")} data-testid="nav-help-utility">
        <span className={shellStyles.navigationIcon} aria-hidden="true"><CircleHelp size={20} /></span>
        <span className={shellStyles.navigationLabel}>{t("nav.help")}</span>
      </button>
      <SupportContact workspaceId={workspaceId} />
      <button type="button" className={`${shellStyles.navigationUtilityButton} ${notificationsActive ? shellStyles.navigationUtilityButtonActive : ""}`} onClick={onOpenNotifications} aria-current={notificationsActive ? "page" : undefined}>
        <span className={shellStyles.navigationIcon} aria-hidden="true"><Bell size={20} /></span>
        <span className={shellStyles.navigationLabel}>{t("nav.notifications")}</span>
      </button>
    </div>;
}
