import { Download, LoaderCircle, Upload } from "lucide-react";
import type { Project } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { useExportCases } from "../../test-cases/exchange/state/export/use-export-cases";
import { settingsCopy } from "./navigation/settings-sections";
import styles from "../../tms.module.css";
import css from "./config.module.css";

type ProjectCaseExchangeProps = Readonly<{ enabled: boolean; project: Project; onImport: () => void }>;
export function ProjectCaseExchange({ enabled, project, onImport }: ProjectCaseExchangeProps) {
  const { t, locale } = useTmsLocale();
  const copy = settingsCopy[locale];
  const exported = useExportCases(project);
  const message = exported.error || (exported.busy ? t("config.exchangeExporting") : exported.completed !== null
    ? t("config.exchangeExported", { count: exported.completed }) : !enabled
      ? t("config.exchangeConnectedOnly") : "");
  return <div className={css.settingsStack} aria-label={t("config.exchangeTitle")}>
    <div className={css.settingRow}>
      <div className={css.settingCopy}>
        <h3 className={css.settingTitle}>{locale === "ru" ? "Экспорт" : "Export"}</h3>
        <p className={css.settingDescription}>{copy.exportHint}</p>
      </div>
      <div className={css.settingControls}>
        <button type="button" className={styles.secondaryButton} disabled={!enabled || exported.busy}
          onClick={() => void exported.start()}>
          {exported.busy ? <LoaderCircle className={styles.spin} size={16} aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
          {t("config.exchangeExport")}
        </button>
      </div>
    </div>
    <div className={css.settingRow}>
      <div className={css.settingCopy}>
        <h3 className={css.settingTitle}>{locale === "ru" ? "Импорт" : "Import"}</h3>
        <p className={css.settingDescription}>{copy.importHint}</p>
      </div>
      <div className={css.settingControls}>
        <button type="button" className={styles.secondaryButton} disabled={!enabled || exported.busy}
          onClick={onImport}><Upload size={16} aria-hidden="true" />{t("config.exchangeImport")}</button>
      </div>
    </div>
    <p className={`${css.exchangeStatus} ${exported.error ? css.exchangeError : ""}`} aria-live="polite" role="status">{message}</p>
  </div>;
}
