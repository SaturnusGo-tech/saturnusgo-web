import { useMemo, useRef, useState } from "react";
import type { RunItemSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { reconcileRunEntries } from "../../navigation/order/reconcile-run-entries";
import type { WorkspaceModel } from "../../../../state/model/useWorkspaceModel";
import { useRunBrowser } from "../../../../runs/batches/state/browser/useRunBrowser";
import { runRepositoryGroups } from "../../../../runs/batches/model/repository/run-repository-groups";
import { useRunAssignments } from "../../../../runs/assignment/state/useRunAssignments";
import { useSelectionFilters } from "../../../cases/selection/controls/SelectionControls";
import { useRunFilterSections } from "../../filters/useRunFilterSections";
import { orderedRunEntries } from "../../navigation/order/ordered-run-entries";

export function useRunRepository(model: WorkspaceModel, ru: boolean) {
  const browser = useRunBrowser({ workspaceId: model.data.workspace.id, selected: model.selectedRun, selectedId: model.selectedRunId,
    knownRuns: model.data.runs, connected: model.connection === "connected", ru,
    onUpdate: (runs) => model.setData((current) => ({ ...current,
      runs: [...current.runs.filter((r) => !runs.some((next) => r.id === next.id)), ...runs] })),
    onRefreshSelected: model.retryRunResource,
    onFinished: (next) => {
      if (next) model.setProjectId(next.projectId);
      model.setSelectedRunId(next?.id ?? null); model.setSelectedRunItemId(null);
    } });
  const [confirmedRevision, setConfirmedRevision] = useState(0);
  const remembered = useRef({ workspaceId: model.data.workspace.id, items: new Map<string, RunItemSummary>() });
  if (remembered.current.workspaceId !== model.data.workspace.id) remembered.current = { workspaceId: model.data.workspace.id, items: new Map() };
  const rows = useMemo(() => reconcileRunEntries(browser.entries, model.runItems, remembered.current.items),
    [browser.entries, model.runItems, model.data.workspace.id, confirmedRevision]);
  const rememberItem = (item: RunItemSummary) => {
    if (remembered.current.workspaceId !== model.data.workspace.id) return;
    remembered.current.items.set(item.id, item); setConfirmedRevision(value => value + 1);
  };
  const run = browser.selectedRuns[0];
  const assignments = useRunAssignments({ workspaceId:model.data.workspace.id,scope:run?.batchId ?? run?.id ?? "",
    runId:run?.id ?? "",rows,ru,onChanged:() => { browser.refresh();model.retryRunResource(); } });
  const runFilters = useRunFilterSections({ workspaceId: model.data.workspace.id, ru, scope:run?.batchId??run?.id??"", rows,
    projects: model.data.projects.filter((project) => rows.some((entry) => entry.projectId === project.id)) });
  const cases = useMemo(() => rows.map((entry) => entry.testCase), [rows]);
  const filters = useSelectionFilters(cases);
  const lookup = new Map(rows.map((entry) => [entry.item.id, entry]));
  const visible = filters.visible.filter((item) => { const row = lookup.get(item.id); return row && runFilters.matches(row); });
  const groups = runRepositoryGroups(visible, runFilters.group, model.data.projects, ru);
  const entries = orderedRunEntries(model.data.workspace.id, groups, rows, filters.filters.includeArchived);
  return { browser, rows, rememberItem, run, assignments, runFilters, cases, filters, visible, groups, lookup, entries };
}
export type RunRepositoryModel = ReturnType<typeof useRunRepository>;
