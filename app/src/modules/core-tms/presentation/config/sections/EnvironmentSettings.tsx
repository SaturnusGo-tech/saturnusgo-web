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
  return <div className={css.settingsStack}>
    <div className={css.sectionLabel}><span>{t("config.environmentsCount", { count: environments.length })}</span>
      <button type="button" className={styles.primaryButton} onClick={onCreate} data-testid="new-environment">
        <Plus size={15} aria-hidden="true" />{t("config.newEnvironment")}
      </button>
    </div>
    {error && <p role="alert" className={css.exchangeError}>{error}</p>}
    {environments.length === 0 ? <div className={css.empty}><Server size={24} aria-hidden="true" />
      <strong>{t("config.emptyEnvironments")}</strong><span>{t("config.emptyEnvironmentsHint")}</span>
    </div> : <ul className={css.environments}>{environments.map((environment) => {
      const archived = environment.status === "archived";
      const baseUrl = environment.baseUrl?.trim();
      return <li key={environment.id}>
        <div className={css.environmentHeading}>
          <h3 className={css.settingTitle}>{environment.name} <span className={css.state} data-archived={archived}>
            {t(archived ? "common.archived" : environment.isDefault ? "common.default" : "common.active")}
          </span></h3>
          <div className={css.rowActions}>
            <button type="button" className={css.iconAction} onClick={() => onEdit(environment.id)}
              title={t("common.edit")} aria-label={`${t("common.edit")}: ${environment.name}`}><Pencil size={17} aria-hidden="true" /></button>
            <button type="button" className={css.iconAction} onClick={() => onToggle(environment.id)}
              title={t(archived ? "common.restore" : "common.archive")}
              aria-label={`${t(archived ? "common.restore" : "common.archive")}: ${environment.name}`}>
              {archived ? <ArchiveRestore size={17} aria-hidden="true" /> : <Archive size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <div className={css.settingCopy}>
          {environment.description && <p className={css.settingDescription}>{environment.description}</p>}
          <p className={css.environmentKey}>{t("config.environmentKey")}: <code>{environment.key}</code></p>
          {baseUrl && <div className={css.url}><code>{baseUrl}</code>
            <button type="button" title={t("config.copyBaseUrl")} aria-label={`${t("config.copyBaseUrl")}: ${environment.name}`}
              onClick={() => void copy(environment)}>{copied === environment.id ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}</button>
            {copied === environment.id && <span className={css.visuallyHidden} role="status">{locale === "ru" ? "Адрес скопирован" : "URL copied"}</span>}
          </div>}
        </div>
      </li>;
    })}</ul>}
  </div>;
}
