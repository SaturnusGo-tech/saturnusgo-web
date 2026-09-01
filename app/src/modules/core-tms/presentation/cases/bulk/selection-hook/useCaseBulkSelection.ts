import { useEffect, useMemo, useState } from "react";
import type { CaseListRow } from "../../types";
import {
  reconcileSelection,
  selectedIdsInOrder,
  selectionCoverage,
  setScopeSelected,
  toggleScopeSelection,
} from "../selection/caseSelection";

export function useCaseBulkSelection(
  allRows: readonly CaseListRow[],
  visibleRows: readonly CaseListRow[],
) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const allIds = useMemo(
    () => allRows.map(({ testCase }) => testCase.id),
    [allRows],
  );
  const visibleIds = useMemo(
    () => visibleRows.map(({ testCase }) => testCase.id),
    [visibleRows],
  );
  const selectedIds = useMemo(
    () => selectedIdsInOrder(selected, allIds),
    [allIds, selected],
  );

  useEffect(() => {
    setSelected((current) => reconcileSelection(current, allIds));
  }, [allIds]);

  return {
    selected,
    selectedIds,
    visibleCoverage: selectionCoverage(selected, visibleIds),
    allCoverage: selectionCoverage(selected, allIds),
    toggleOne: (id: string) => setSelected((current) => (
      setScopeSelected(current, [id], !current.has(id))
    )),
    toggleScope: (ids: readonly string[]) => setSelected((current) => (
      toggleScopeSelection(current, ids)
    )),
    selectVisible: () => setSelected((current) => (
      setScopeSelected(current, visibleIds, true)
    )),
    selectAll: () => setSelected((current) => (
      setScopeSelected(current, allIds, true)
    )),
    clear: () => setSelected(new Set()),
  };
}
