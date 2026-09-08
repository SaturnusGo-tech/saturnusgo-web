import { Archive, ArchiveRestore, Pencil } from "lucide-react";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { settingsCopy } from "../navigation/settings-sections";
import styles from "../../../tms.module.css";
import css from "../config.module.css";
export function ProjectSettings({ project, onEdit, onToggle }: { project: Project; onEdit: () => void; onToggle: () => void }) {
  const { t, locale } = useTmsLocale();
  return <>
    <div className={css.projectIdentity}><span className={css.projectMark} aria-hidden="true">{project.key.slice(0, 2)}</span>
      <div><h3>{project.name}</h3><p>{project.description || t("header.currentProject")}</p></div>
      <button type="button" className={styles.secondaryButton} onClick={onEdit}><Pencil size={14} />{t("common.edit")}</button>
    </div>
    <dl className={css.details}>
      <div><dt>{t("config.projectKey")}</dt><dd><code>{project.key}</code></dd></div>
      <div><dt>{t("common.status")}</dt><dd><span className={css.state} data-archived={project.status === "archived"}>{t(project.status === "archived" ? "common.archived" : "common.active")}</span></dd></div>
    </dl>
    <div className={css.preferenceRow}><div className={css.preferenceCopy}><strong>{t(project.status === "archived" ? "common.restore" : "common.archive")}</strong>
      <span>{settingsCopy[locale].archiveHint}</span></div>
      <button type="button" className={styles.secondaryButton} onClick={onToggle}>{project.status === "archived" ? <ArchiveRestore size={15} /> : <Archive size={15} />}{t(project.status === "archived" ? "common.restore" : "common.archive")}</button>
    </div>
  </>;
}
