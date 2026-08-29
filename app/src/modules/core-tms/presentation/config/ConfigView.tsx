import { Archive, ArchiveRestore, Copy, Pencil, Plus } from "lucide-react";
import type { Environment, Project } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { AppearanceSettings } from "./settings/AppearanceSettings";
import { ProjectCaseExchange } from "./ProjectCaseExchange";
import styles from "../../tms.module.css";
import surface from "./config.module.css";

type ConfigViewProps = {
  environments: Environment[];
  project?: Project;
  onCreate: () => void;
  onEditEnvironment: (id: string) => void;
  onToggleEnvironment: (id: string) => void;
  onEditProject: () => void;
  onToggleProject: () => void;
  exchangeEnabled: boolean;
  onCasesImported: () => Promise<unknown>;
};

export function ConfigView({ environments, project, onCreate, onEditEnvironment, onToggleEnvironment, onEditProject, onToggleProject, exchangeEnabled, onCasesImported }: ConfigViewProps) {
  const { t } = useTmsLocale();
  return <div className={`${styles.pageScroll} ${surface.page}`} data-testid="config-view">
    <header className={surface.header}><div><h1>{t("config.title")}</h1><p>{t("config.description")}</p></div><button className={styles.primaryButton} onClick={onCreate} data-testid="new-environment"><Plus size={16} /> {t("config.newEnvironment")}</button></header>
    {project && <section className={surface.projectSection} aria-labelledby="project-settings-title">
      <div className={surface.sectionLabel}><h2 id="project-settings-title">{t("config.projectSettings")}</h2></div>
      <div className={surface.projectRow}>
        <div className={surface.projectIdentity}><strong>{project.name}</strong><span>{project.description || t("header.currentProject")}</span></div>
        <dl className={surface.projectMeta}><div><dt>{t("config.projectKey")}</dt><dd>{project.key}</dd></div><div><dt>{t("common.status")}</dt><dd>{project.status === "archived" ? t("common.archived") : t("common.active")}</dd></div></dl>
        <div className={surface.rowActions}><button className={styles.secondaryButton} onClick={onEditProject}><Pencil size={15} /> {t("common.edit")}</button><button className={styles.textButton} onClick={onToggleProject}>{project.status === "archived" ? <ArchiveRestore size={15} /> : <Archive size={15} />} {project.status === "archived" ? t("common.restore") : t("common.archive")}</button></div>
      </div>
      <ProjectCaseExchange enabled={exchangeEnabled} project={project} onImported={onCasesImported} />
    </section>}
    <AppearanceSettings />
    <section className={surface.environmentSection} aria-labelledby="environment-list-title">
      <div className={surface.sectionLabel}><h2 id="environment-list-title">{t("config.environmentsCount", { count: environments.length })}</h2></div>
      {environments.length === 0 ? <div className={surface.empty}><strong>{t("config.emptyEnvironments")}</strong><span>{t("config.emptyEnvironmentsHint")}</span></div> : <div className={surface.tableViewport}><table className={surface.table}>
        <thead><tr><th scope="col">{t("config.environmentName")}</th><th scope="col">{t("config.baseUrl")}</th><th scope="col">{t("config.environmentKey")}</th><th scope="col">{t("common.status")}</th><th scope="col">{t("common.actions")}</th></tr></thead>
        <tbody>{environments.map((environment) => <tr key={environment.id}>
          <td><span className={surface.environmentName}><strong>{environment.name}</strong><small>{environment.description}</small></span></td>
          <td><span className={surface.url}><code title={environment.baseUrl}>{environment.baseUrl}</code><button className={styles.iconButton} title={t("config.copyBaseUrl")} aria-label={`${t("config.copyBaseUrl")}: ${environment.name}`} onClick={() => navigator.clipboard?.writeText(environment.baseUrl)}><Copy size={15} /></button></span></td>
          <td><code>{environment.key}</code></td>
          <td><span className={surface.state} data-archived={environment.status === "archived"}>{environment.status === "archived" ? t("common.archived") : environment.isDefault ? t("common.default") : t("common.active")}</span></td>
          <td><div className={surface.rowActions}><button className={styles.textButton} onClick={() => onEditEnvironment(environment.id)}><Pencil size={14} /> {t("common.edit")}</button><button className={styles.textButton} onClick={() => onToggleEnvironment(environment.id)}>{environment.status === "archived" ? <ArchiveRestore size={14} /> : <Archive size={14} />} {environment.status === "archived" ? t("common.restore") : t("common.archive")}</button></div></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </div>;
}
