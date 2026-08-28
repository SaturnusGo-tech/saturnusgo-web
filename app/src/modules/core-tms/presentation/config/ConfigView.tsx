import { Archive, ArchiveRestore, CheckCircle2, Copy, FlaskConical, Pencil, Plus, Settings } from "lucide-react";
import type { Environment, Project } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { SectionHeading } from "../common/heading/SectionHeading";
import styles from "../../tms.module.css";

type ConfigViewProps = {
  environments: Environment[];
  project?: Project;
  onCreate: () => void;
  onEditEnvironment: (id: string) => void;
  onToggleEnvironment: (id: string) => void;
  onEditProject: () => void;
  onToggleProject: () => void;
};

export function ConfigView({ environments, project, onCreate, onEditEnvironment, onToggleEnvironment, onEditProject, onToggleProject }: ConfigViewProps) {
  const { t } = useTmsLocale();
  return <div className={styles.pageScroll}>
    <SectionHeading eyebrow={t("config.eyebrow")} title={t("config.title")} description={t("config.description")} action={<button className={styles.primaryButton} onClick={onCreate} data-testid="new-environment"><Plus size={16} /> {t("config.newEnvironment")}</button>} />
    {project && <section className={`${styles.panel} ${styles.configProject}`}>
      <div><Settings size={20} /><span><strong>{project.name}</strong><small>{project.key} · {t("config.projectSettings")}</small></span></div>
      <div className={styles.inlineActions}><button className={styles.secondaryButton} onClick={onEditProject}><Pencil size={15} /> {t("common.edit")}</button><button className={styles.textButton} onClick={onToggleProject}>{project.status === "archived" ? <ArchiveRestore size={15} /> : <Archive size={15} />} {project.status === "archived" ? t("common.restore") : t("common.archive")}</button></div>
    </section>}
    <div className={styles.environmentGrid}>{environments.map((environment) => <article className={styles.environmentCard} key={environment.id}>
      <div className={styles.environmentTop}><span><FlaskConical size={19} /></span><div className={styles.environmentActions}>{environment.isDefault && <b>{t("common.default")}</b>}<button className={styles.iconButton} aria-label={`${t("common.edit")}: ${environment.name}`} title={t("common.edit")} onClick={() => onEditEnvironment(environment.id)}><Pencil size={15} /></button><button className={styles.iconButton} aria-label={`${environment.status === "archived" ? t("common.restore") : t("common.archive")}: ${environment.name}`} title={environment.status === "archived" ? t("common.restore") : t("common.archive")} onClick={() => onToggleEnvironment(environment.id)}>{environment.status === "archived" ? <ArchiveRestore size={15} /> : <Archive size={15} />}</button></div></div>
      <h2>{environment.name}</h2><div className={styles.environmentUrl}><code title={environment.baseUrl}>{environment.baseUrl}</code><button className={styles.iconButton} title={t("config.copyBaseUrl")} aria-label={`${t("config.copyBaseUrl")}: ${environment.name}`} onClick={() => navigator.clipboard?.writeText(environment.baseUrl)}><Copy size={16} /></button></div><p>{environment.description}</p><div><small>{project?.key}</small><strong>{environment.key}</strong></div>
    </article>)}</div>
    <section className={`${styles.panel} ${styles.configPanel}`}><div><Settings size={20} /><span><strong>{t("config.executionDefaults")}</strong><small>{t("config.executionDefaultsHint")}</small></span></div><span className={`${styles.statusPill} ${styles.status_passed}`}><CheckCircle2 size={15} /> {t("common.active")}</span></section>
  </div>;
}
