import { Archive, ChevronRight, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  RunItemSummary,
  TestCaseSummary,
  TestRunSummary,
} from "../../../../../core/tms/contracts/legacy-contract";
import { localizedLabel } from "../../../localization/format/labels";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { statusIcon } from "../../status/executionStatus";
import styles from "./run-navigator.module.css";

export type RunListMode = "active" | "archived";

type RunNavigatorProps = {
  runs: TestRunSummary[];
  cases: TestCaseSummary[];
  selectedRun: TestRunSummary | null;
  items: RunItemSummary[];
  selectedItemId: string | null;
  progress: number;
  mode: RunListMode;
  archivePending?: boolean;
  onModeChange: (mode: RunListMode) => void;
  onSelectRun: (id: string) => void;
  onSelectItem: (id: string) => void;
  onCreate: () => void;
  onArchive?: (run: TestRunSummary) => void;
  onRestore?: (run: TestRunSummary) => void;
};

export function RunNavigator({
  runs, cases, selectedRun, items, selectedItemId, progress, mode,
  archivePending = false, onModeChange, onSelectRun, onSelectItem,
  onCreate, onArchive, onRestore,
}: RunNavigatorProps) {
  const { locale, t } = useTmsLocale();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const titles = useMemo(
    () => new Map(cases.map((item) => [item.id, item.title])),
    [cases],
  );
  const activeCount = runs.filter((run) => !run.archivedAt).length;
  const archivedCount = runs.length - activeCount;
  const visibleRuns = runs.filter((run) => mode === "archived" ? Boolean(run.archivedAt) : !run.archivedAt);
  const emptyLabel = mode === "archived" ? t("runs.noArchived") : t("runs.noActive");

  useEffect(() => setConfirmArchive(false), [mode, selectedRun?.id]);

  return (
    <aside className={styles.navigator} aria-label={t("runs.current")}>
      <div className={styles.viewSwitch} role="tablist" aria-label={t("runs.listMode")}>
        {(["active", "archived"] as const).map((value) => (
          <button
            className={mode === value ? styles.viewActive : styles.viewTab}
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => onModeChange(value)}
          >
            {value === "active" ? t("runs.activeList") : t("runs.archiveHistory")}
            <span>{value === "active" ? activeCount : archivedCount}</span>
          </button>
        ))}
      </div>

      <div className={styles.picker}>
        <select
          aria-label={t("runs.current")}
          value={selectedRun?.id ?? ""}
          disabled={visibleRuns.length === 0}
          onChange={(event) => onSelectRun(event.target.value)}
        >
          {visibleRuns.length === 0 && <option value="">{emptyLabel}</option>}
          {visibleRuns.map((run) => <option value={run.id} key={run.id}>{run.name}</option>)}
        </select>
        <button type="button" onClick={onCreate} aria-label={t("runs.new")} title={t("runs.new")}>
          <Plus size={16} />
        </button>
      </div>

      {!selectedRun ? (
        <div className={styles.emptyHistory}>
          <strong>{emptyLabel}</strong>
          <p>{mode === "archived" ? t("runs.noArchivedHint") : t("runs.noActiveHint")}</p>
        </div>
      ) : (
        <>
          <header className={styles.summary}>
            <div className={styles.summaryMeta}>
              <span>{selectedRun.key}</span>
              <span>{localizedLabel(locale, selectedRun.type)}</span>
            </div>
            <h2>{selectedRun.name}</h2>
            <p>{selectedRun.environment.name} · {selectedRun.build}</p>
            <div className={styles.progress} aria-label={t("runs.percentComplete", { percent: progress })}>
              <i style={{ width: `${progress}%` }} />
            </div>
            <div className={styles.progressLabel}>
              <strong>{t("runs.percentComplete", { percent: progress })}</strong>
              <span>{selectedRun.progress.executed} / {selectedRun.itemCount}</span>
            </div>
            {selectedRun.archivedAt ? (
              <div className={styles.archivedActions}>
                <span><Archive size={14} /> {t("runs.archivedOn", {
                  date: new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
                    dateStyle: "medium",
                  }).format(new Date(selectedRun.archivedAt)),
                })}</span>
                {onRestore && <button type="button" disabled={archivePending} onClick={() => onRestore(selectedRun)}>
                  <RotateCcw size={14} /> {t("runs.restoreAction")}
                </button>}
              </div>
            ) : onArchive && !confirmArchive && (
              <button className={styles.archiveTrigger} type="button" onClick={() => setConfirmArchive(true)}>
                <Archive size={14} /> {t("runs.removeFromList")}
              </button>
            )}
          </header>

          {confirmArchive && onArchive && (
            <section className={styles.archiveConfirm} aria-live="polite">
              <strong>{t("runs.removeConfirm", { key: selectedRun.key })}</strong>
              <p>{t("runs.removeKeepsHistory")}</p>
              <div>
                <button type="button" onClick={() => setConfirmArchive(false)}>{t("common.cancel")}</button>
                <button type="button" disabled={archivePending} onClick={() => onArchive(selectedRun)}>
                  {t("runs.removeAction")}
                </button>
              </div>
            </section>
          )}

          <div className={styles.items}>
            {items.map((item, index) => (
              <button
                className={item.id === selectedItemId ? styles.itemActive : styles.item}
                key={item.id}
                type="button"
                onClick={() => onSelectItem(item.id)}
              >
                <span className={styles.itemStatus}>{statusIcon[item.status]}</span>
                <span className={styles.itemText}>
                  <small>{index + 1} · {item.caseKey} · {t("cases.revision", { revision: item.revision })}</small>
                  <strong>{titles.get(item.caseId) ?? item.caseKey}</strong>
                </span>
                <ChevronRight size={14} />
              </button>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
