import { ArrowRightLeft, CheckCircle2, Network, Play, Plus, Search } from "lucide-react";
import { useState } from "react";
import type { TestCase } from "../../../../core/tms/contracts/legacy-contract";
import { latestRevision } from "../../helpers/cases/caseRevision";
import { formatCount } from "../../localization/format/count";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { EmptyState } from "../common/empty/EmptyState";
import { SectionHeading } from "../common/heading/SectionHeading";
import styles from "../../tms.module.css";
export function IntegrationsView({ cases, onCreate, onOpenCase, onRun }: { cases: TestCase[]; onCreate: () => void; onOpenCase: (testCase: TestCase) => void; onRun: (caseId: string) => void }) {
  const { locale, t } = useTmsLocale();
  const [query, setQuery] = useState("");
  const integrationCases = cases.filter((item) => !item.archivedAt && latestRevision(item).tags.includes("integration"));
  const visible = integrationCases.filter((item) => {
    const value = latestRevision(item);
    return `${item.key} ${value.title} ${value.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
  });
  const tagValue = (item: TestCase, prefix: string) => latestRevision(item).tags.find((tagName) => tagName.startsWith(`${prefix}:`))?.slice(prefix.length + 1) || t("integrations.notSet");
  return <div className={styles.pageScroll} data-testid="integrations-view">
    <SectionHeading
      eyebrow={t("integrations.eyebrow")}
      title={t("integrations.title")}
      description={t("integrations.description")}
      action={<button className={styles.primaryButton} onClick={onCreate} data-testid="new-integration"><Plus size={16} /> {t("integrations.new")}</button>}
    />
    <div className={styles.integrationOverview}>
      <div><ArrowRightLeft size={22} /><span><strong>{formatCount(locale, integrationCases.length, ["integration check", "integration checks"], ["интеграционная проверка", "интеграционные проверки", "интеграционных проверок"])}</strong><small>{t("integrations.coverageTypes")}</small></span></div>
      <div><Network size={22} /><span><strong>{formatCount(locale, new Set(integrationCases.flatMap((item) => [tagValue(item, "source"), tagValue(item, "target")])).size, ["system", "systems"], ["система", "системы", "систем"])}</strong><small>{t("integrations.coverageHint")}</small></span></div>
      <div><CheckCircle2 size={22} /><span><strong>{t("integrations.readyCount", { count: integrationCases.filter((item) => latestRevision(item).lifecycle === "ready").length })}</strong><small>{t("integrations.readyHint")}</small></span></div>
    </div>
    <section className={styles.panel}>
      <div className={styles.panelHeader}><div><h2>{t("integrations.contracts")}</h2><p>{t("integrations.contractsHint")}</p></div><label className={styles.tableSearch}><Search size={15} /><input aria-label={t("integrations.searchAria")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("integrations.searchPlaceholder")} /></label></div>
      {visible.length === 0 ? <EmptyState icon={<Network size={32} />} title={t("integrations.empty")} text={t("integrations.emptyHint")} action={<button className={styles.primaryButton} onClick={onCreate}><Plus size={16} /> {t("integrations.create")}</button>} /> : <div className={styles.integrationTable}>
        <div className={styles.integrationTableHead}>{[t("integrations.testCase"), t("integrations.source"), t("integrations.target"), t("integrations.contract"), t("integrations.status"), t("common.actions")].map((header) => <span key={header}>{header}</span>)}</div>
        {visible.map((item) => { const value = latestRevision(item); return <div className={styles.integrationRow} key={item.id}>
          <button className={styles.integrationCaseLink} onClick={() => onOpenCase(item)}><small>{item.key}</small><strong>{value.title}</strong></button>
          <span>{tagValue(item, "source")}</span><span>{tagValue(item, "target")}</span><code>{tagValue(item, "contract")}</code>
          <span className={styles[`status_${value.lifecycle === "ready" ? "passed" : "not_run"}`]}>{localizedLabel(locale, value.lifecycle)}</span>
          <div><button className={styles.secondaryButton} onClick={() => onOpenCase(item)}>{t("common.open")}</button><button className={styles.primaryButton} onClick={() => onRun(item.id)}><Play size={14} /> {t("cases.run")}</button></div>
        </div>; })}
      </div>}
    </section>
  </div>;
}
