import { Play, Plus, Search } from "lucide-react";
import { useState } from "react";
import type { TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "../../tms.module.css";
export function IntegrationsView({ cases, onCreate, onOpenCase, onRun }: { cases: TestCaseSummary[]; onCreate: () => void; onOpenCase: (testCase: TestCaseSummary) => void; onRun: (caseId: string) => void }) {
  const { locale, t } = useTmsLocale();
  const [query, setQuery] = useState("");
  const integrationCases = cases.filter((item) => !item.archivedAt && item.tags.includes("integration"));
  const visible = integrationCases.filter((item) => `${item.key} ${item.title} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const tagValue = (item: TestCaseSummary, prefix: string) => item.tags.find((tagName) => tagName.startsWith(`${prefix}:`))?.slice(prefix.length + 1) || t("integrations.notSet");
  return <div className={styles.pageScroll} data-testid="integrations-view">
    <header className={styles.workbenchPageHeader}>
      <div><span>{t("integrations.eyebrow")}</span><h1>{t("integrations.title")}</h1><p>{t("integrations.description")}</p></div>
      <button className={styles.primaryButton} onClick={onCreate} data-testid="new-integration"><Plus size={16} /> {t("integrations.new")}</button>
    </header>
    <section className={styles.integrationWorkspace}>
      <div className={styles.workbenchToolbar}><div><h2>{t("integrations.contracts")}</h2><p>{t("integrations.contractsHint")}</p></div><label className={styles.tableSearch}><Search size={15} /><input aria-label={t("integrations.searchAria")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("integrations.searchPlaceholder")} /></label></div>
      <div className={styles.integrationTable}>
        <div className={styles.integrationTableHead}>{[t("integrations.testCase"), t("integrations.source"), t("integrations.target"), t("integrations.contract"), t("integrations.status"), t("common.actions")].map((header) => <span key={header}>{header}</span>)}</div>
        {visible.length === 0 ? <div className={styles.workbenchEmptyRow}><div><strong>{t("integrations.empty")}</strong><span>{t("integrations.emptyHint")}</span></div><button className={styles.secondaryButton} onClick={onCreate}><Plus size={15} /> {t("integrations.create")}</button></div> : visible.map((item) => <div className={styles.integrationRow} key={item.id}>
          <button className={styles.integrationCaseLink} onClick={() => onOpenCase(item)}><small>{item.key}</small><strong>{item.title}</strong></button>
          <span>{tagValue(item, "source")}</span><span>{tagValue(item, "target")}</span><code>{tagValue(item, "contract")}</code>
          <span className={styles[`status_${item.lifecycle === "ready" ? "passed" : "not_run"}`]}>{localizedLabel(locale, item.lifecycle)}</span>
          <div><button className={styles.secondaryButton} onClick={() => onOpenCase(item)}>{t("common.open")}</button><button className={styles.primaryButton} onClick={() => onRun(item.id)}><Play size={14} /> {t("cases.run")}</button></div>
        </div>)}
      </div>
    </section>
  </div>;
}
