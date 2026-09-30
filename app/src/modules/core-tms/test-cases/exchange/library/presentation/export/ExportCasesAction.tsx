import { Download, LoaderCircle } from "lucide-react";
import type { Project } from "../../../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { useExportCases } from "../../../state/export/use-export-cases";
import css from "../page/import-page.module.css";

export function ExportCasesAction({ project, enabled }: { project: Project; enabled: boolean }) {
  const { t, locale } = useTmsLocale();
  const exported = useExportCases(project);
  const message = exported.error || (exported.busy ? t("config.exchangeExporting") : exported.completed !== null
    ? t("config.exchangeExported", { count: exported.completed }) : !enabled ? t("config.exchangeConnectedOnly") : "");
  return <div className={css.exportAction}>
    <button type="button" className={css.secondary} disabled={!enabled || exported.busy} title={project.name} onClick={() => void exported.start()}>
      {exported.busy ? <LoaderCircle className={css.spin} size={16} aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
      {locale === "ru" ? "Экспортировать кейсы" : "Export test cases"}
    </button>
    {message && <p className={exported.error ? css.error : css.hint} role="status">{message}</p>}
  </div>;
}
