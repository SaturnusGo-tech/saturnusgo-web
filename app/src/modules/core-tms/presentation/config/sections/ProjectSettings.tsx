import { Archive, ArchiveRestore, Pencil } from "lucide-react";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { settingsCopy } from "../navigation/settings-sections";
import styles from "../../../tms.module.css";
import css from "../config.module.css";

export function ProjectSettings({ project, onEdit, onToggle }: { project: Project; onEdit: () => void; onToggle: () => void }) {
  const { t, locale } = useTmsLocale();
  const archived = project.status === "archived";
  return <div className={css.settingsStack}>
    <section className={css.projectSummary}>
      <div className={css.settingRow}>
        <div className={css.settingCopy}>
          <h3 className={css.settingTitle}>{project.name}</h3>
          {project.description && <p className={css.settingDescription}>{project.description}</p>}
        </div>
        <div className={css.settingControls}>
          <button type="button" className={styles.secondaryButton} onClick={onEdit}>
            <Pencil size={15} aria-hidden="true" />{t("common.edit")}
          </button>
        </div>
      </div>
      <dl className={css.detailGrid}>
        <div className={css.detailItem}><dt className={css.fieldLabel}>{t("config.projectKey")}</dt>
          <dd className={css.fieldValue}><code>{project.key}</code></dd></div>
        <div className={css.detailItem}><dt className={css.fieldLabel}>{t("common.status")}</dt>
          <dd className={css.fieldValue}><span className={css.state} data-archived={archived}>
            {t(archived ? "common.archived" : "common.active")}
          </span></dd></div>
      </dl>
    </section>
    <div className={css.settingRow} data-subtle="true">
      <div className={css.settingCopy}>
        <h3 className={css.settingTitle}>{t(archived ? "common.restore" : "common.archive")}</h3>
        <p className={css.settingDescription}>{settingsCopy[locale].archiveHint}</p>
      </div>
      <div className={css.settingControls}>
        <button type="button" className={styles.secondaryButton} onClick={onToggle}>
          {archived ? <ArchiveRestore size={15} aria-hidden="true" /> : <Archive size={15} aria-hidden="true" />}
          {t(archived ? "common.restore" : "common.archive")}
        </button>
      </div>
    </div>
  </div>;
}
