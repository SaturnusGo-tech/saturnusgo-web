import { Download, LoaderCircle, Upload } from "lucide-react";
import { useState } from "react";
import type { Project } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { ImportCasesDialog } from "../../test-cases/exchange/presentation/ImportCasesDialog";
import { useExportCases } from "../../test-cases/exchange/state/export/use-export-cases";
import styles from "../../tms.module.css";
import { settingsCopy } from "./navigation/settings-sections";
import surface from "./config.module.css";

type ProjectCaseExchangeProps = Readonly<{ enabled: boolean; project: Project; onImported: () => Promise<unknown> }>;
export function ProjectCaseExchange({ enabled, project, onImported }: ProjectCaseExchangeProps) {
  const { t, locale } = useTmsLocale();
  const copy = settingsCopy[locale];
  const [importing, setImporting] = useState(false);
  const exported = useExportCases(project);
  const message = exported.error || (exported.busy ? t("config.exchangeExporting") : exported.completed !== null
    ? t("config.exchangeExported", { count: exported.completed }) : !enabled
      ? t("config.exchangeConnectedOnly") : t("config.exchangeFormat"));
  return <div className={surface.exchange} aria-label={t("config.exchangeTitle")}>
    <div className={surface.exchangeActions}>
      <div className={surface.exchangeRow}><div><h3>{locale === "ru" ? "Экспорт" : "Export"}</h3><p>{copy.exportHint}</p></div>
        <button type="button" className={styles.secondaryButton} disabled={!enabled || exported.busy}
          onClick={() => void exported.start()}>{exported.busy ? <LoaderCircle className={styles.spin} size={16} /> : <Download size={16} />}{t("config.exchangeExport")}</button></div>
      <div className={surface.exchangeRow}><div><h3>{locale === "ru" ? "Импорт" : "Import"}</h3>
        <p>{locale === "ru" ? "Выберите JSON, проверьте дерево папок и место импорта." : "Choose JSON, review the folder tree and destination."}</p></div>
        <button type="button" className={styles.secondaryButton} disabled={!enabled || exported.busy}
          onClick={() => setImporting(true)}><Upload size={16} />{t("config.exchangeImport")}</button></div>
    </div>
    <p className={`${surface.exchangeStatus} ${exported.error ? surface.exchangeError : ""}`} aria-live="polite">{message}</p>
    {importing && <ImportCasesDialog project={project} folders={[]} onImported={onImported} onClose={() => setImporting(false)} />}
  </div>;
}
