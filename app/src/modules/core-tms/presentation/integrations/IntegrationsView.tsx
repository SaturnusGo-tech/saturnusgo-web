import { Network, Play, Plus, Search } from "lucide-react";
import { useState } from "react";
import type { TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { EmptyState } from "../common/empty/EmptyState";
import { SectionHeading } from "../common/heading/SectionHeading";
import styles from "../../tms.module.css";
export function IntegrationsView({ cases, onCreate, onOpenCase, onRun }: { cases: TestCaseSummary[]; onCreate: () => void; onOpenCase: (testCase: TestCaseSummary) => void; onRun: (caseId: string) => void }) {
  const { locale, t } = useTmsLocale();
  const [query, setQuery] = useState("");
  const integrationCases = cases.filter((item) => !item.archivedAt && item.tags.includes("integration"));
  const visible = integrationCases.filter((item) => `${item.key} ${item.title} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const tagValue = (item: TestCaseSummary, prefix: string) => item.tags.find((tagName) => tagName.startsWith(`${prefix}:`))?.slice(prefix.length + 1) || t("integrations.notSet");
  return <div className={styles.pageScroll} data-testid="integrations-view">
    <SectionHeading
      eyebrow={t("integrations.eyebrow")}
      title={t("integrations.title")}
      description={t("integrations.description")}
      action={<button className={styles.primaryButton} onClick={onCreate} data-testid="new-integration"><Plus size={16} /> {t("integrations.new")}</button>}
    />
    <section className={`${styles.panel} ${styles.integrationWorkspace}`}>
      <div className={styles.panelHeader}><div><h2>{t("integrations.contracts")}</h2><p>{t("integrations.contractsHint")}</p></div><label className={styles.tableSearch}><Search size={15} /><input aria-label={t("integrations.searchAria")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("integrations.searchPlaceholder")} /></label></div>
      {visible.length === 0 ? <EmptyState icon={<Network size={32} />} title={t("integrations.empty")} text={t("integrations.emptyHint")} action={<button className={styles.primaryButton} onClick={onCreate}><Plus size={16} /> {t("integrations.create")}</button>} /> : <div className={styles.integrationTable}>
        <div className={styles.integrationTableHead}>{[t("integrations.testCase"), t("integrations.source"), t("integrations.target"), t("integrations.contract"), t("integrations.status"), t("common.actions")].map((header) => <span key={header}>{header}</span>)}</div>
        {visible.map((item) => <div className={styles.integrationRow} key={item.id}>
          <button className={styles.integrationCaseLink} onClick={() => onOpenCase(item)}><small>{item.key}</small><strong>{item.title}</strong></button>
          <span>{tagValue(item, "source")}</span><span>{tagValue(item, "target")}</span><code>{tagValue(item, "contract")}</code>
          <span className={styles[`status_${item.lifecycle === "ready" ? "passed" : "not_run"}`]}>{localizedLabel(locale, item.lifecycle)}</span>
          <div><button className={styles.secondaryButton} onClick={() => onOpenCase(item)}>{t("common.open")}</button><button className={styles.primaryButton} onClick={() => onRun(item.id)}><Play size={14} /> {t("cases.run")}</button></div>
        </div>)}
      </div>}
    </section>
  </div>;
}
