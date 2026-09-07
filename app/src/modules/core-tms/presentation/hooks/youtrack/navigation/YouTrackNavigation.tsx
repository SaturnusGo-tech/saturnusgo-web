import { BookOpen, Settings2, FolderKanban, GitBranch, Webhook } from "lucide-react";
import type { HooksCopy } from "../../shared/hooks-copy";
import { IntegrationGuideLink } from "../../shared/theme/IntegrationGuideLink";
import styles from "../youtrack.module.css";

export type YouTrackTab = "connection" | "projects" | "workflow" | "webhook";
export function YouTrackNavigation({ tab, onTab, copy, canManage, russian }: {
  tab: YouTrackTab; onTab: (tab: YouTrackTab) => void; copy: HooksCopy; canManage: boolean; russian: boolean;
}) {
  const items = [{ id: "connection" as const, title: copy.connection, Icon: Settings2 },
    { id: "projects" as const, title: russian ? "Проекты и правила" : "Projects & rules", Icon: FolderKanban },
    { id: "workflow" as const, title: copy.workflow, Icon: GitBranch },
    ...(canManage ? [{ id: "webhook" as const, title: "Webhook", Icon: Webhook }] : [])];
  return <aside className={styles.sidebar}>
    <div className={styles.sideTitle}>{russian ? "НАСТРОЙКИ ИНТЕГРАЦИИ" : "INTEGRATION SETTINGS"}</div>
    <nav aria-label={russian ? "Разделы YouTrack" : "YouTrack sections"}>
      {items.map(({ id, title, Icon }) => <button key={id} type="button" aria-current={tab === id ? "page" : undefined}
        onClick={() => onTab(id)}><Icon size={16} aria-hidden="true" />{title}</button>)}
    </nav>
    <IntegrationGuideLink article="youtrack" className={styles.helpLink}><BookOpen size={15} aria-hidden="true" />{russian ? "Руководство по YouTrack" : "YouTrack guide"}</IntegrationGuideLink>
    <div className={styles.sideFoot}>Falcon <span>↔</span> YouTrack</div>
  </aside>;
}
