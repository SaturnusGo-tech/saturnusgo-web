import { Archive, Check, ChevronDown, ChevronRight, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  onRestore?: (run: TestRunSummary) => void;
};

export function RunNavigator({
  runs, cases, selectedRun, items, selectedItemId, progress, mode,
  archivePending = false, onModeChange, onSelectRun, onSelectItem,
  onCreate, onRestore,
}: RunNavigatorProps) {
  const { locale, t } = useTmsLocale();
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const titles = useMemo(
    () => new Map(cases.map((item) => [item.id, item.title])),
    [cases],
  );
  const activeCount = runs.filter((run) => !run.archivedAt).length;
  const archivedCount = runs.length - activeCount;
  const visibleRuns = runs.filter((run) => mode === "archived" ? Boolean(run.archivedAt) : !run.archivedAt);
  const emptyLabel = mode === "archived" ? t("runs.noArchived") : t("runs.noActive");

  useEffect(() => setPickerOpen(false), [mode, selectedRun?.id]);
  useEffect(() => {
    if (!pickerOpen) return;
    function closeOnPointer(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPickerOpen(false);
    }
    document.addEventListener("pointerdown", closeOnPointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnPointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [pickerOpen]);

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

      <div className={styles.picker} ref={pickerRef}>
        <button
          className={styles.pickerTrigger}
          type="button"
          disabled={visibleRuns.length === 0}
          aria-haspopup="listbox"
          aria-expanded={pickerOpen}
          aria-controls="run-picker-list"
          aria-label={t("runs.openRunList")}
          onClick={() => setPickerOpen((current) => !current)}
        >
          <span>
            <small>{t("runs.current")}</small>
            <strong>{selectedRun ? `${selectedRun.key} · ${selectedRun.name}` : emptyLabel}</strong>
            {selectedRun && <em>{selectedRun.environment.name} · {selectedRun.build}</em>}
          </span>
          <ChevronDown size={17} aria-hidden="true" />
        </button>
        <button className={styles.pickerCreate} type="button" onClick={onCreate} aria-label={t("runs.new")} title={t("runs.new")}>
          <Plus size={16} />
        </button>
        {pickerOpen && (
          <div className={styles.pickerMenu} id="run-picker-list" role="listbox" aria-label={t("runs.current")}>
            {visibleRuns.map((run) => {
              const percent = Math.round((run.progress.executed / Math.max(1, run.itemCount)) * 100);
              const selected = run.id === selectedRun?.id;
              return (
                <button
                  className={selected ? styles.pickerOptionActive : styles.pickerOption}
                  key={run.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => { onSelectRun(run.id); setPickerOpen(false); }}
                >
                  <span><strong>{run.name}</strong><small>{run.key} · {run.environment.name} · {run.build}</small></span>
                  <em>{percent}%</em>
                  {selected ? <Check size={15} aria-hidden="true" /> : <span className={styles.optionMarker} />}
                </button>
              );
            })}
          </div>
        )}
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
            ) : null}
          </header>

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
