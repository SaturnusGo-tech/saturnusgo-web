import { ArrowRightLeft, CheckCircle2, Network, Play, Plus, Search } from "lucide-react";
import { useState } from "react";
import type { TestCase } from "../../../../core/tms/contracts/legacy-contract";
import { latestRevision } from "../../helpers/cases/caseRevision";
import { EmptyState } from "../common/empty/EmptyState";
import { SectionHeading } from "../common/heading/SectionHeading";
import styles from "../../tms.module.css";
export function IntegrationsView({ cases, onCreate, onOpenCase, onRun }: { cases: TestCase[]; onCreate: () => void; onOpenCase: (testCase: TestCase) => void; onRun: (caseId: string) => void }) {
  const [query, setQuery] = useState("");
  const integrationCases = cases.filter((item) => !item.archivedAt && latestRevision(item).tags.includes("integration"));
  const visible = integrationCases.filter((item) => {
    const value = latestRevision(item);
    return `${item.key} ${value.title} ${value.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
  });
  const tagValue = (item: TestCase, prefix: string) => latestRevision(item).tags.find((tagName) => tagName.startsWith(`${prefix}:`))?.slice(prefix.length + 1) || "Not set";
  return <div className={styles.pageScroll} data-testid="integrations-view">
    <SectionHeading
      eyebrow="Cross-system quality"
      title="Integration testing"
      description="Model source-to-target contracts separately, then run them with the same immutable evidence trail."
      action={<button className={styles.primaryButton} onClick={onCreate} data-testid="new-integration"><Plus size={16} /> New integration test</button>}
    />
    <div className={styles.integrationOverview}>
      <div><ArrowRightLeft size={22} /><span><strong>{integrationCases.length} integration {integrationCases.length === 1 ? "check" : "checks"}</strong><small>API, events, deep links, and data contracts</small></span></div>
      <div><Network size={22} /><span><strong>{new Set(integrationCases.flatMap((item) => [tagValue(item, "source"), tagValue(item, "target")])).size} systems</strong><small>Visible dependency coverage</small></span></div>
      <div><CheckCircle2 size={22} /><span><strong>{integrationCases.filter((item) => latestRevision(item).lifecycle === "ready").length} ready</strong><small>Available for test runs</small></span></div>
    </div>
    <section className={styles.panel}>
      <div className={styles.panelHeader}><div><h2>Integration contracts</h2><p>Every row is an executable manual contract with source and target context.</p></div><label className={styles.tableSearch}><Search size={15} /><input aria-label="Search integration tests" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search integrations" /></label></div>
      {visible.length === 0 ? <EmptyState icon={<Network size={32} />} title="No integration tests yet" text="Create the first source-to-target contract and add it to a run." action={<button className={styles.primaryButton} onClick={onCreate}><Plus size={16} /> Create integration test</button>} /> : <div className={styles.integrationTable}>
        <div className={styles.integrationTableHead}><span>Test case</span><span>Source</span><span>Target</span><span>Contract</span><span>Status</span><span>Actions</span></div>
        {visible.map((item) => { const value = latestRevision(item); return <div className={styles.integrationRow} key={item.id}>
          <button className={styles.integrationCaseLink} onClick={() => onOpenCase(item)}><small>{item.key}</small><strong>{value.title}</strong></button>
          <span>{tagValue(item, "source")}</span><span>{tagValue(item, "target")}</span><code>{tagValue(item, "contract")}</code>
          <span className={styles[`status_${value.lifecycle === "ready" ? "passed" : "not_run"}`]}>{value.lifecycle}</span>
          <div><button className={styles.secondaryButton} onClick={() => onOpenCase(item)}>Open</button><button className={styles.primaryButton} onClick={() => onRun(item.id)}><Play size={14} /> Run</button></div>
        </div>; })}
      </div>}
    </section>
  </div>;
}
