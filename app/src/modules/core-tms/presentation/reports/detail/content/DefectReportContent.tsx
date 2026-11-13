import { Circle } from "lucide-react";
import type { Defect } from "../../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { MarkdownField } from "../../../cases/inspector/markdown/MarkdownField";
import css from "./defect-content.module.css";

export function DefectReportContent({ defect }: { defect: Defect }) {
  const { locale, t } = useTmsLocale();
  return <div className={css.content}>
    <section className={css.description}>
      <h3>{t("reports.descriptionHeading")}</h3>
      <MarkdownField value={defect.description} label={t("reports.descriptionHeading")} emptyLabel={t("reports.noDescription")} allowAttachments={false} />
    </section>
    {defect.preconditions?.trim() && <section className={css.description}>
      <h3>{locale === "ru" ? "Предусловия" : "Preconditions"}</h3>
      <MarkdownField value={defect.preconditions} label={locale === "ru" ? "Предусловия" : "Preconditions"} allowAttachments={false} />
    </section>}
    {defect.testData?.trim() && <section className={css.description}>
      <h3>{locale === "ru" ? "Тестовые данные" : "Test data"}</h3>
      <MarkdownField value={defect.testData} label={locale === "ru" ? "Тестовые данные" : "Test data"} allowAttachments={false} />
    </section>}
    <dl className={css.results}>
      <div className={css.result} data-actual>
        <dt><Circle size={8} aria-hidden="true" /><span>{locale === "ru" ? "Фактически" : "Actual"}</span></dt>
        <dd><MarkdownField value={defect.actualResult} label={t("reports.actualResult")} emptyLabel={t("reports.notProvided")} allowAttachments={false} /></dd>
      </div>
      <div className={css.result}>
        <dt><Circle size={13} aria-hidden="true" /><span>{locale === "ru" ? "Ожидается" : "Expected"}</span></dt>
        <dd><MarkdownField value={defect.expectedResult} label={t("reports.expectedResult")} emptyLabel={t("reports.notProvided")} allowAttachments={false} /></dd>
      </div>
    </dl>
  </div>;
}
