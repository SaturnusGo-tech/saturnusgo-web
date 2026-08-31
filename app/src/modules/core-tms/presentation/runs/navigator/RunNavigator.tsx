import { Archive, Check, ChevronDown, ChevronRight, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RunItemSummary, TestCaseSummary, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
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
  mode: RunListMode;
  archivePending?: boolean;
  onModeChange: (mode: RunListMode) => void;
  onSelectRun: (id: string) => void;
  onSelectItem: (id: string) => void;
  onCreate: () => void;
  onRestore?: (run: TestRunSummary) => void;
};

export function RunNavigator({
  runs, cases, selectedRun, items, selectedItemId, mode,
  archivePending = false, onModeChange, onSelectRun, onSelectItem,
  onCreate, onRestore,
}: RunNavigatorProps) {
  const { locale, t } = useTmsLocale();
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const pickerTriggerRef = useRef<HTMLButtonElement>(null);
  const titles = useMemo(() => new Map(cases.map((item) => [item.id, item.title])), [cases]);
  const activeCount = runs.filter((run) => !run.archivedAt).length;
  const archivedCount = runs.length - activeCount;
  const visibleRuns = runs.filter((run) => mode === "archived" ? Boolean(run.archivedAt) : !run.archivedAt);
  const emptyLabel = mode === "archived" ? t("runs.noArchived") : t("runs.noActive");
  const selectedPickerIndex = Math.max(0, visibleRuns.findIndex((run) => run.id === selectedRun?.id));

  function pickerOptions() { return Array.from(pickerRef.current?.querySelectorAll<HTMLButtonElement>("[role='option']") ?? []); }
  function openPickerAt(index: number) {
    setPickerOpen(true);
    requestAnimationFrame(() => pickerOptions()[index]?.focus());
  }

  function closePicker(restoreFocus = false) {
    setPickerOpen(false);
    if (restoreFocus) requestAnimationFrame(() => pickerTriggerRef.current?.focus());
  }

  useEffect(() => setPickerOpen(false), [mode, selectedRun?.id]);
  useEffect(() => {
    if (!pickerOpen) return;
    function closeOnPointer(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) setPickerOpen(false);
    }
    document.addEventListener("pointerdown", closeOnPointer);
    return () => document.removeEventListener("pointerdown", closeOnPointer);
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
          ref={pickerTriggerRef}
          className={styles.pickerTrigger}
          type="button"
          disabled={visibleRuns.length === 0}
          aria-haspopup="listbox"
          aria-expanded={pickerOpen}
          aria-controls="run-picker-list"
          aria-label={t("runs.openRunList")}
          onClick={() => setPickerOpen((current) => !current)}
          onKeyDown={(event) => {
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              const index = event.key === "ArrowUp" || event.key === "End" ? visibleRuns.length - 1 : event.key === "Home" ? 0 : selectedPickerIndex;
              openPickerAt(index);
            }
            if (event.key === "Escape" && pickerOpen) {
              event.preventDefault();
              closePicker(true);
            }
          }}
        >
          <span className={styles.pickerTriggerText}><strong title={selectedRun?.name ?? emptyLabel}>{selectedRun?.name ?? emptyLabel}</strong>
            {selectedRun ? <small>{selectedRun.key}</small> : null}
          </span>
          <ChevronDown size={17} aria-hidden="true" />
        </button>
        <button className={styles.pickerCreate} type="button" onClick={onCreate} aria-label={t("runs.new")} title={t("runs.new")}>
          <Plus size={16} />
        </button>
        {pickerOpen && (
          <div className={styles.pickerMenu} id="run-picker-list" role="listbox" aria-label={t("runs.current")} onKeyDown={(event) => {
            const options = pickerOptions();
            const current = Math.max(0, options.indexOf(document.activeElement as HTMLButtonElement));
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const direction = event.key === "ArrowDown" ? 1 : -1;
              options[(current + direction + options.length) % options.length]?.focus();
            }
            if (event.key === "Home" || event.key === "End") {
              event.preventDefault();
              options[event.key === "Home" ? 0 : options.length - 1]?.focus();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              closePicker(true);
            }
            if (event.key === "Tab") closePicker();
          }}>
            {visibleRuns.map((run) => {
              const selected = run.id === selectedRun?.id;
              return (
                <button
                  className={selected ? styles.pickerOptionActive : styles.pickerOption}
                  key={run.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => { onSelectRun(run.id); closePicker(true); }}
                >
                  <span><strong title={run.name}>{run.name}</strong><small>{run.key}</small></span>
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
              <span>{selectedRun.progress.executed} / {selectedRun.itemCount}</span>
            </div>
            <p>{selectedRun.environment.name} · {selectedRun.build}</p>
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
                aria-current={item.id === selectedItemId ? "true" : undefined}
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
