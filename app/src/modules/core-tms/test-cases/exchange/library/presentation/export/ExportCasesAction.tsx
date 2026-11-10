import { ErrorToast } from "../../../../../presentation/common/error/ErrorToast";
import { LoadingOrb } from "../../../../../../../shared/components/loading/LoadingOrb";
import { Download } from "lucide-react";
import type { Project } from "../../../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../../../localization/context/useTmsLocale";
import { useExportCases } from "../../../state/export/use-export-cases";
import css from "../page/import-page.module.css";

export function ExportCasesAction({ project, enabled }: { project: Project; enabled: boolean }) {
  const { t, locale } = useTmsLocale();
  const exported = useExportCases(project);
  const message = exported.busy ? t("config.exchangeExporting") : exported.completed !== null
    ? t("config.exchangeExported", { count: exported.completed }) : !enabled ? t("config.exchangeConnectedOnly") : "";
  return <div className={css.exportAction}>
    <button type="button" className={css.primary} disabled={!enabled || exported.busy} title={project.name} onClick={() => void exported.start()}>
      {exported.busy ? <LoadingOrb /> : <Download size={16} aria-hidden="true" />}
      {locale === "ru" ? "Экспортировать кейсы" : "Export test cases"}
    </button>
    <ErrorToast message={exported.error} />
    {!exported.error && message && <p className={css.hint} role="status">{message}</p>}
  </div>;
}
