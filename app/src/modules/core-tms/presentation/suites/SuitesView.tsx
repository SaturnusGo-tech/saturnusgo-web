import { Filter, ListChecks, Play, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import type { Suite, TestCase } from "../../../../core/tms/contracts/legacy-contract";
import { latestRevision } from "../../helpers/cases/caseRevision";
import { matchesSuite } from "../../helpers/suites/matchesSuite";
import { EmptyState } from "../common/empty/EmptyState";
import { SectionHeading } from "../common/heading/SectionHeading";
import styles from "../../tms.module.css";
export function SuitesView({ suites, cases, selected, onSelect, onCreate, onConfigure, onRun }: { suites: Suite[]; cases: TestCase[]; selected: string; onSelect: (id: string) => void; onCreate: () => void; onConfigure: (id: string) => void; onRun: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const visibleSuites = suites.filter((suite) => `${suite.key} ${suite.name} ${suite.description}`.toLowerCase().includes(query.toLowerCase()));
  const selectedSuite = suites.find((item) => item.id === selected) ?? suites[0];
  const suiteCases = selectedSuite ? cases.filter((item) => matchesSuite(item, selectedSuite)) : [];
  return (
    <div className={styles.twoPane}>
      <aside className={`${styles.pane} ${styles.listPane}`}>
        <div className={styles.listPaneHeader}><div><h2>Test suites</h2><p>Reusable release scopes</p></div><button className={styles.secondaryButton} onClick={onCreate} data-testid="new-suite"><Plus size={16} /> New suite</button></div>
        <label className={styles.searchField}><Search size={16} /><input aria-label="Search test suites" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search suites" /></label>
        <div className={styles.cardList}>{visibleSuites.map((suite) => { const count = cases.filter((item) => matchesSuite(item, suite)).length; return <button className={`${styles.suiteCard} ${suite.id === selectedSuite?.id ? styles.suiteCardActive : ""}`} key={suite.id} onClick={() => onSelect(suite.id)}><span><ListChecks size={18} /></span><div><small>{suite.key} · {suite.type}</small><strong>{suite.name}</strong><p>{count} test {count === 1 ? "case" : "cases"}</p></div></button>; })}{visibleSuites.length === 0 && <div className={styles.miniEmpty}><Search size={19} /><span>No suites found</span></div>}</div>
      </aside>
      <section className={`${styles.pane} ${styles.largePane}`}>
        {!selectedSuite ? <EmptyState icon={<ListChecks size={32} />} title="No suites" text="Build a reusable set of test cases." action={<button className={styles.primaryButton} onClick={onCreate}><Plus size={16} /> Create suite</button>} /> : <>
          <SectionHeading eyebrow={selectedSuite.key} title={selectedSuite.name} description={selectedSuite.description} action={<><button className={styles.secondaryButton} onClick={() => onConfigure(selectedSuite.id)}><SlidersHorizontal size={15} /> Configure</button><button className={styles.primaryButton} onClick={() => onRun(selectedSuite.id)} data-testid="run-suite"><Play size={15} /> Run suite</button></>} />
          <div className={styles.filterSummary}><Filter size={16} /><span>{selectedSuite.type === "dynamic" ? `Dynamic filter: ${(selectedSuite.filter.tags ?? []).join(", ")}` : "Static selection"}</span><strong>{suiteCases.length} cases</strong></div>
          <div className={styles.dataTable}><div className={styles.dataTableHead}><span>Key</span><span>Test case</span><span>Priority</span><span>Owner</span></div>{suiteCases.map((item) => { const value = latestRevision(item); return <div className={styles.dataTableRow} key={item.id}><span>{item.key}</span><strong>{value.title}</strong><span className={styles[`priority_${value.priority}`]}>{value.priority}</span><span>{value.owner}</span></div>; })}</div>
        </>}
      </section>
    </div>
  );
}
