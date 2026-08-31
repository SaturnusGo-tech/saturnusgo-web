import { Play, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { Suite, SuiteSummary, TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import { matchesSuite } from "../../helpers/suites/matchesSuite";
import { formatCount } from "../../localization/format/count";
import { localizedLabel } from "../../localization/format/labels";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import { TessiqLoader } from "../common/loading/TessiqLoader";
import styles from "../../tms.module.css";
import view from "./suites.module.css";
export function SuitesView({ suites, cases, selected, selectedDetail, onSelect, onCreate, onConfigure, onRun }: { suites: SuiteSummary[]; cases: TestCaseSummary[]; selected: string; selectedDetail: Suite | null; onSelect: (id: string) => void; onCreate: () => void; onConfigure: (id: string) => void; onRun: (id: string) => void }) {
  const { locale, t } = useTmsLocale();
  const [query, setQuery] = useState("");
  const visibleSuites = suites.filter((suite) => `${suite.key} ${suite.name} ${suite.description}`.toLowerCase().includes(query.toLowerCase()));
  const selectedSuite = suites.find((item) => item.id === selected) ?? suites[0];
  const detail = selectedDetail?.id === selectedSuite?.id ? selectedDetail : null;
  const suiteCases = detail ? cases.filter((item) => matchesSuite(item, detail)) : [];
  return (
    <div className={view.workspace}>
      <aside className={view.rail}>
        <div className={view.railHeader}><div><h2>{t("suite.title")}</h2><p>{formatCount(locale, suites.length, ["suite", "suites"], ["сьют", "сьюта", "сьютов"])}</p></div><button className={styles.iconButton} onClick={onCreate} data-testid="new-suite" aria-label={t("suite.new")} title={t("suite.new")}><Plus size={16} /></button></div>
        <label className={view.search}><Search size={16} /><input aria-label={t("suite.searchAria")} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("suite.searchPlaceholder")} /></label>
        <div className={view.list}>{visibleSuites.map((suite) => <button className={view.suiteRow} data-selected={suite.id === selectedSuite?.id} key={suite.id} onClick={() => onSelect(suite.id)}><small>{suite.key} · {localizedLabel(locale, suite.type)}</small><strong>{suite.name}</strong><span>{suite.type === "dynamic" ? localizedLabel(locale, "dynamic") : formatCount(locale, suite.caseCount, ["case", "cases"], ["кейс", "кейса", "кейсов"])}</span></button>)}{visibleSuites.length === 0 && <div className={view.emptyList}><span>{t("suite.notFound")}</span><button className={styles.textButton} onClick={onCreate}><Plus size={14} />{t("suite.new")}</button></div>}</div>
      </aside>
      <section className={view.content}>
        {!selectedSuite ? <div className={view.blank}><strong>{t("suite.empty")}</strong><span>{t("suite.emptyHint")}</span><button className={styles.primaryButton} onClick={onCreate}><Plus size={16} /> {t("suite.create")}</button></div> : !detail ? <TessiqLoader pane label={t("common.loading")} testId="suite-detail-loading" /> : <>
          <header className={view.detailHeader}><div><span className={view.key}>{selectedSuite.key}</span><h1>{selectedSuite.name}</h1><p>{selectedSuite.description}</p></div><div><button className={styles.secondaryButton} disabled={!detail} onClick={() => onConfigure(selectedSuite.id)}><SlidersHorizontal size={15} /> {t("common.configure")}</button><button className={styles.primaryButton} onClick={() => onRun(selectedSuite.id)} data-testid="run-suite"><Play size={15} /> {t("suite.run")}</button></div></header>
          <div className={view.scopeLine}><span>{detail.type === "dynamic" ? `${localizedLabel(locale, "dynamic")}: ${(detail.filter.tags ?? []).join(", ")}` : t("suite.staticSelection")}</span><strong>{formatCount(locale, detail.resolvedCaseCount, ["case", "cases"], ["кейс", "кейса", "кейсов"])}</strong></div>
          <div className={view.tableScroll}><div className={view.table}><div className={view.tableHead}>{[t("suite.key"), t("suite.testCase"), t("suite.priority"), t("suite.owner")].map((header) => <span key={header}>{header}</span>)}</div>{suiteCases.length === 0 ? <div className={view.tableEmpty}>{t("suite.notFound")}</div> : suiteCases.map((item) => <div className={view.tableRow} key={item.id}><span>{item.key}</span><strong title={item.title}>{item.title}</strong><span className={view.priority} data-priority={item.priority}>{localizedLabel(locale, item.priority)}</span><span>{item.ownerIdentityId ?? t("common.unassigned")}</span></div>)}</div></div>
        </>}
      </section>
    </div>
  );
}
