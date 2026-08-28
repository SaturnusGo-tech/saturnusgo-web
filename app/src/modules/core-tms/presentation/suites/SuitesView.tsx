import { Filter, ListChecks, Play, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { Suite, TestCase } from "../../../../core/tms/contracts/legacy-contract";
import { latestRevision } from "../../helpers/cases/caseRevision";
import { matchesSuite } from "../../helpers/suites/matchesSuite";
import { formatCount } from "../../localization/format/count";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { EmptyState } from "../common/empty/EmptyState";
import { SectionHeading } from "../common/heading/SectionHeading";
import styles from "../../tms.module.css";
export function SuitesView({ suites, cases, selected, onSelect, onCreate, onConfigure, onRun }: { suites: Suite[]; cases: TestCase[]; selected: string; onSelect: (id: string) => void; onCreate: () => void; onConfigure: (id: string) => void; onRun: (id: string) => void }) {
  const { locale, t } = useTmsLocale();
  const [query, setQuery] = useState("");
  const visibleSuites = suites.filter((suite) => `${suite.key} ${suite.name} ${suite.description}`.toLowerCase().includes(query.toLowerCase()));
  const selectedSuite = suites.find((item) => item.id === selected) ?? suites[0];
  const suiteCases = selectedSuite ? cases.filter((item) => matchesSuite(item, selectedSuite)) : [];
  return (
    <div className={styles.twoPane}>
      <aside className={`${styles.pane} ${styles.listPane}`}>
        <div className={styles.listPaneHeader}><div><h2>{t("suite.title")}</h2><p>{t("suite.subtitle")}</p></div><button className={styles.secondaryButton} onClick={onCreate} data-testid="new-suite"><Plus size={16} /> {t("suite.new")}</button></div>
        <label className={styles.searchField}><Search size={16} /><input aria-label={t("suite.searchAria")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("suite.searchPlaceholder")} /></label>
        <div className={styles.cardList}>{visibleSuites.map((suite) => { const count = cases.filter((item) => matchesSuite(item, suite)).length; return <button className={`${styles.suiteCard} ${suite.id === selectedSuite?.id ? styles.suiteCardActive : ""}`} key={suite.id} onClick={() => onSelect(suite.id)}><span><ListChecks size={18} /></span><div><small>{suite.key} · {localizedLabel(locale, suite.type)}</small><strong>{suite.name}</strong><p>{formatCount(locale, count, ["test case", "test cases"], ["тест-кейс", "тест-кейса", "тест-кейсов"])}</p></div></button>; })}{visibleSuites.length === 0 && <div className={styles.miniEmpty}><Search size={19} /><span>{t("suite.notFound")}</span></div>}</div>
      </aside>
      <section className={`${styles.pane} ${styles.largePane}`}>
        {!selectedSuite ? <EmptyState icon={<ListChecks size={32} />} title={t("suite.empty")} text={t("suite.emptyHint")} action={<button className={styles.primaryButton} onClick={onCreate}><Plus size={16} /> {t("suite.create")}</button>} /> : <>
          <SectionHeading eyebrow={selectedSuite.key} title={selectedSuite.name} description={selectedSuite.description} action={<><button className={styles.secondaryButton} onClick={() => onConfigure(selectedSuite.id)}><SlidersHorizontal size={15} /> {t("common.configure")}</button><button className={styles.primaryButton} onClick={() => onRun(selectedSuite.id)} data-testid="run-suite"><Play size={15} /> {t("suite.run")}</button></>} />
          <div className={styles.filterSummary}><Filter size={16} /><span>{selectedSuite.type === "dynamic" ? `${localizedLabel(locale, "dynamic")}: ${(selectedSuite.filter.tags ?? []).join(", ")}` : t("suite.staticSelection")}</span><strong>{formatCount(locale, suiteCases.length, ["case", "cases"], ["кейс", "кейса", "кейсов"])}</strong></div>
          <div className={styles.dataTable}><div className={styles.dataTableHead}>{[t("suite.key"), t("suite.testCase"), t("suite.priority"), t("suite.owner")].map((header) => <span key={header}>{header}</span>)}</div>{suiteCases.map((item) => { const value = latestRevision(item); return <div className={styles.dataTableRow} key={item.id}><span>{item.key}</span><strong>{value.title}</strong><span className={styles[`priority_${value.priority}`]}>{localizedLabel(locale, value.priority)}</span><span>{value.owner}</span></div>; })}</div>
        </>}
      </section>
    </div>
  );
}
