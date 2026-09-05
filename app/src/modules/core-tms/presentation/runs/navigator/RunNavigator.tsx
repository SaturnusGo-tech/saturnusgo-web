import { Archive, ChevronDown, CircleDashed, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { RunItemSummary, TestCaseSummary, TestRunSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import { CaseTypeIcon } from "../../cases/list/CaseBadges";
import { PrioritySignal, prioritySignalRank } from "../../cases/list/priority/PrioritySignal";
import { statusIcon } from "../../status/executionStatus";
import styles from "./run-navigator.module.css";
import { RunPicker } from "./picker/RunPicker";

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
  const [query, setQuery] = useState("");
  const [prioritySort, setPrioritySort] = useState<"asc" | "desc" | null>(null);
  const caseById = useMemo(() => new Map(cases.map((item) => [item.id, item])), [cases]);
  const activeCount = runs.filter((run) => !run.archivedAt).length;
  const archivedCount = runs.length - activeCount;
  const visibleRuns = runs.filter((run) => mode === "archived" ? Boolean(run.archivedAt) : !run.archivedAt);
  const emptyLabel = mode === "archived" ? t("runs.noArchived") : t("runs.noActive");
  const normalizedQuery = query.trim().toLocaleLowerCase(locale === "ru" ? "ru-RU" : "en-US");
  const filteredItems = normalizedQuery ? items.filter((item) => {
    const testCase = caseById.get(item.caseId);
    return [item.caseKey, testCase?.title, testCase?.component]
      .some((value) => value?.toLocaleLowerCase(locale === "ru" ? "ru-RU" : "en-US").includes(normalizedQuery));
  }) : items;
  const visibleItems = useMemo(() => {
    if (!prioritySort) return filteredItems;
    const direction = prioritySort === "asc" ? 1 : -1;
    return [...filteredItems].sort((left, right) => {
      const leftPriority = caseById.get(left.caseId)?.priority ?? "low";
      const rightPriority = caseById.get(right.caseId)?.priority ?? "low";
      return (prioritySignalRank[leftPriority] - prioritySignalRank[rightPriority]) * direction
        || left.caseKey.localeCompare(right.caseKey, locale === "ru" ? "ru-RU" : "en-US", { numeric: true, sensitivity: "base" });
    });
  }, [caseById, filteredItems, locale, prioritySort]);

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

      <RunPicker
        visibleRuns={visibleRuns}
        selectedRun={selectedRun}
        mode={mode}
        emptyLabel={emptyLabel}
        openListLabel={t("runs.openRunList")}
        currentLabel={t("runs.current")}
        createLabel={t("runs.new")}
        onSelectRun={onSelectRun}
        onCreate={onCreate}
      />

      {!selectedRun ? (
        <div className={styles.emptyHistory}>
          <strong>{emptyLabel}</strong>
          <p>{mode === "archived" ? t("runs.noArchivedHint") : t("runs.noActiveHint")}</p>
        </div>
      ) : (
        <>
          <header className={styles.summary}>
            <div className={styles.summaryMeta}>
              <strong>{selectedRun.key}</strong>
              <span>{selectedRun.progress.executed} / {selectedRun.itemCount}</span>
            </div>
            <div className={styles.progressTrack} aria-label={t("runs.percentComplete", { percent: selectedRun.progress.percent })}>
              <span style={{ width: `${selectedRun.progress.percent}%` }} />
            </div>
            <p><span>{selectedRun.environment.name}</span><span>{selectedRun.build}</span></p>
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

          <div className={styles.itemsToolbar}>
            <div><strong>{locale === "ru" ? "Тест-кейсы" : "Test cases"}</strong><span>{items.length}</span></div>
            <label>
              <Search size={14} aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label={locale === "ru" ? "Поиск кейсов в ране" : "Search cases in run"} placeholder={locale === "ru" ? "Поиск по названию или ID" : "Search title or ID"} />
            </label>
          </div>
          <div className={styles.itemColumns} role="row">
            <span><button type="button" className={styles.prioritySortButton}
              onClick={() => setPrioritySort((current) => current === "desc" ? "asc" : "desc")}
              aria-label={locale === "ru" ? "Сортировать по приоритету" : "Sort by priority"}
              title={locale === "ru" ? "Сортировать по приоритету" : "Sort by priority"}
              data-active={Boolean(prioritySort) || undefined} data-direction={prioritySort ?? undefined}><ChevronDown size={14} /></button></span>
            <span />
            <span>ID</span>
            <span>{locale === "ru" ? "Тест-кейс" : "Test case"}</span>
            <span>{t("runs.status")}</span>
          </div>
          <div className={styles.items} role="table" aria-label={locale === "ru" ? "Тест-кейсы выбранного рана" : "Selected run test cases"}>
            {visibleItems.map((item, index) => {
              const testCase = caseById.get(item.caseId);
              return (
              <button
                className={item.id === selectedItemId ? styles.itemActive : styles.item}
                key={item.id}
                type="button"
                role="row"
                aria-current={item.id === selectedItemId ? "true" : undefined}
                onClick={() => onSelectItem(item.id)}
              >
                <span className={styles.prioritySignal} role="cell">
                  {testCase && <PrioritySignal priority={testCase.priority} label={localizedLabel(locale, testCase.priority)} size={14} />}
                </span>
                <span className={styles.typeSignal} role="cell">{testCase && <CaseTypeIcon locale={locale} type={testCase.type} />}</span>
                <strong className={styles.itemKey} role="cell">{item.caseKey}</strong>
                <span className={styles.itemText} role="cell">
                  <strong>{testCase?.title ?? item.caseKey}</strong>
                  <small>{testCase?.component || t("cases.revision", { revision: item.revision })}</small>
                </span>
                <span className={`${styles.executionBadge} ${styles[`execution_${item.status}`]}`} role="cell">{item.status === "not_run" ? <CircleDashed size={16} /> : statusIcon[item.status]}{localizedLabel(locale, item.status)}</span>
              </button>
            )})}
            {visibleItems.length === 0 && <div className={styles.itemsEmpty}><Search size={18} /><span>{locale === "ru" ? "Кейсы не найдены" : "No cases found"}</span></div>}
          </div>
        </>
      )}
    </aside>
  );
}
