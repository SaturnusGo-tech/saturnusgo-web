import { NotificationBell } from "../../notifications/inbox/composition/NotificationBell";
import css from "./styles/sidebar-system.module.css";

export function NavigationUtilityMenu({ workspaceId, connected, subject, tooltips }: {
  workspaceId: string; connected: boolean; subject: string; tooltips: boolean;
}) {
  return <div className={css.utilities} data-sidebar-independent>
    <NotificationBell key={`${workspaceId}:${subject}`} workspaceId={workspaceId} connected={connected} tooltipEnabled={tooltips}
      navigationClasses={{ button: css.item, icon: css.icon, label: css.label }}/>
  </div>;
}
