import { Play, Plus, Search } from "lucide-react";
import { useState } from "react";
import type { TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import styles from "../../tms.module.css";
import surface from "./integrations.module.css";

export function IntegrationsView({ cases, onCreate, onOpenCase, onRun }: { cases: TestCaseSummary[]; onCreate: () => void; onOpenCase: (testCase: TestCaseSummary) => void; onRun: (caseId: string) => void }) {
  const { locale, t } = useTmsLocale();
  const [query, setQuery] = useState("");
  const integrationCases = cases.filter((item) => !item.archivedAt && item.tags.includes("integration"));
  const visible = integrationCases.filter((item) => `${item.key} ${item.title} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const tagValue = (item: TestCaseSummary, prefix: string) => item.tags.find((tagName) => tagName.startsWith(`${prefix}:`))?.slice(prefix.length + 1) || t("integrations.notSet");
  return <div className={`${styles.pageScroll} ${surface.page}`} data-testid="integrations-view">
    <header className={surface.header}>
      <div><h1>{t("integrations.title")}</h1><p>{t("integrations.description")}</p></div>
      <button className={styles.primaryButton} onClick={onCreate} data-testid="new-integration"><Plus size={16} /> {t("integrations.new")}</button>
    </header>
    <section className={surface.workspace} aria-labelledby="integration-contracts-title">
      <div className={surface.toolbar}>
        <div><h2 id="integration-contracts-title">{t("integrations.contracts")}</h2><span>{t("integrations.checkCount", { count: integrationCases.length })}</span></div>
        <label className={surface.search}><Search size={16} /><input aria-label={t("integrations.searchAria")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("integrations.searchPlaceholder")} /></label>
      </div>
      <div className={surface.tableViewport}>
        <table className={surface.table}>
          <thead><tr>{[t("integrations.testCase"), t("integrations.source"), t("integrations.target"), t("integrations.contract"), t("integrations.status"), t("common.actions")].map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead>
          <tbody>{visible.length === 0 ? <tr><td className={surface.emptyCell} colSpan={6}><div className={surface.empty}><div><strong>{t(query.trim() ? "integrations.noResults" : "integrations.empty")}</strong><span>{t(query.trim() ? "integrations.noResultsHint" : "integrations.emptyHint")}</span></div></div></td></tr> : visible.map((item) => <tr key={item.id}>
            <td><button className={surface.caseLink} onClick={() => onOpenCase(item)}><small>{item.key}</small><strong>{item.title}</strong></button></td>
            <td>{tagValue(item, "source")}</td><td>{tagValue(item, "target")}</td><td><code>{tagValue(item, "contract")}</code></td>
            <td><span className={surface.status} data-ready={item.lifecycle === "ready"}>{localizedLabel(locale, item.lifecycle)}</span></td>
            <td><div className={surface.actions}><button className={styles.textButton} onClick={() => onOpenCase(item)}>{t("common.open")}</button><button className={styles.secondaryButton} onClick={() => onRun(item.id)}><Play size={14} /> {t("cases.run")}</button></div></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  </div>;
}
