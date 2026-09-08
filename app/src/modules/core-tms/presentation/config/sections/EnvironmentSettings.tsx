import { Archive, ArchiveRestore, Check, Copy, Pencil, Plus, Server } from "lucide-react";
import { useState } from "react";
import type { Environment } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import styles from "../../../tms.module.css";
import css from "../config.module.css";
export function EnvironmentSettings({ environments, onCreate, onEdit, onToggle }: {
  environments: Environment[]; onCreate: () => void; onEdit: (id: string) => void; onToggle: (id: string) => void;
}) {
  const { t, locale } = useTmsLocale();
  const [copied, setCopied] = useState("");
  const [error, setError] = useState("");
  async function copy(environment: Environment) {
    try { await navigator.clipboard.writeText(environment.baseUrl); setCopied(environment.id); setError(""); }
    catch { setError(locale === "ru" ? "Не удалось скопировать адрес. Выделите его и скопируйте вручную." : "Could not copy the URL. Select and copy it manually."); }
  }
  return <>
    <div className={css.sectionLabel}><span>{t("config.environmentsCount", { count: environments.length })}</span>
      <button type="button" className={styles.primaryButton} onClick={onCreate} data-testid="new-environment"><Plus size={15} />{t("config.newEnvironment")}</button></div>
    {error && <p role="alert" className={css.exchangeError}>{error}</p>}
    {environments.length === 0 ? <div className={css.empty}><Server size={24} /><strong>{t("config.emptyEnvironments")}</strong><span>{t("config.emptyEnvironmentsHint")}</span></div>
      : <ul className={css.environments}>{environments.map((environment) => <li key={environment.id}>
        <Server size={19} className={css.envIcon} aria-hidden="true" />
        <div className={css.envInfo}><div className={css.envTitle}><h3>{environment.name}</h3>
          <span className={css.state} data-archived={environment.status === "archived"}>{t(environment.status === "archived" ? "common.archived" : environment.isDefault ? "common.default" : "common.active")}</span></div>
          {environment.description && <p>{environment.description}</p>}
          <div className={css.url}><code>{environment.baseUrl}</code><button type="button" title={t("config.copyBaseUrl")} aria-label={`${t("config.copyBaseUrl")}: ${environment.name}`}
            onClick={() => void copy(environment)}>{copied === environment.id ? <Check size={14} /> : <Copy size={14} />}</button></div>
          <small>{t("config.environmentKey")}: {environment.key}</small>
        </div>
        <div className={css.rowActions}><button type="button" className={styles.iconButton} onClick={() => onEdit(environment.id)} title={t("common.edit")} aria-label={`${t("common.edit")}: ${environment.name}`}><Pencil size={15} /></button>
          <button type="button" className={styles.iconButton} onClick={() => onToggle(environment.id)} title={t(environment.status === "archived" ? "common.restore" : "common.archive")}
            aria-label={`${t(environment.status === "archived" ? "common.restore" : "common.archive")}: ${environment.name}`}>{environment.status === "archived" ? <ArchiveRestore size={15} /> : <Archive size={15} />}</button></div>
      </li>)}</ul>}
  </>;
}
