import { useRef } from "react";
import type { TestCaseRevision } from "../../../../core/tms/contracts/legacy-contract";
import {
  formatTmsMutationFailure,
  toTmsMutationFailure,
} from "../../../../core/tms/errors/mutation-failure";
import {
  resolvePendingOperation,
  type PendingOperation,
} from "../../../../core/tms/idempotency/pending-operation";
import {
  MAX_CASE_BULK_MUTATION_ITEMS,
  type BulkCaseMutationResult,
} from "../../../../core/tms/contracts/test-cases/bulk-case-contract";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import {
  bulkUpdateTestCases,
  type BulkCasePatch,
} from "../../test-cases/data/bulk/test-case-bulk-api";
import type { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";
import {
  bulkFailureInvalidatesSelection,
  reconcileCaseSummaries,
  shouldRefreshAfterBulkFailure,
} from "./reconciliation/reconcileCaseSummaries";

export function useCaseBulkActions(
  state: ReturnType<typeof useWorkspaceState>,
  derived: ReturnType<typeof useWorkspaceDerived>,
  notify: (message: string) => void,
) {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale();
  const operation = useRef<PendingOperation | null>(null);
  const inFlight = useRef<Promise<BulkCaseMutationResult> | null>(null);
  const ru = locale === "ru";

  async function refreshSafely(projectId: string) {
    try { await state.loadProject(projectId); } catch {}
  }

  async function execute(
    caseIds: string[],
    patch: BulkCasePatch,
  ): Promise<BulkCaseMutationResult> {
    if (inFlight.current) return inFlight.current;
    const task = mutate(caseIds, patch);
    inFlight.current = task;
    try { return await task; } finally { inFlight.current = null; }
  }

  async function mutate(
    caseIds: string[],
    patch: BulkCasePatch,
  ): Promise<BulkCaseMutationResult> {
    const project = derived.project;
    if (state.connection !== "connected" || !project) {
      return { ok: false, message: ru
        ? "Массовое изменение доступно только при подключении к TMS."
        : "Bulk updates require a TMS connection." };
    }
    const ids = Array.from(new Set(caseIds));
    if (ids.length === 0 || ids.length > MAX_CASE_BULK_MUTATION_ITEMS) {
      return { ok: false, message: ru
        ? `Выберите от 1 до ${MAX_CASE_BULK_MUTATION_ITEMS} активных кейсов.`
        : `Select between 1 and ${MAX_CASE_BULK_MUTATION_ITEMS} active cases.` };
    }
    const byId = new Map(derived.projectCases.map((item) => [item.id, item]));
    const targets = ids.map((id) => byId.get(id));
    if (targets.some((item) => !item || item.archivedAt || !item.etag)) {
      await refreshSafely(project.id);
      return { ok: false, message: ru
        ? "Состав или версии кейсов изменились. Список обновлён — проверьте выбор и повторите."
        : "Case scope or versions changed. The list was refreshed; review the selection and retry." };
    }
    const items = targets.map((item) => ({ caseId: item!.id, ifMatch: item!.etag! }));
    const signature = JSON.stringify({ projectId: project.id, items, patch });
    operation.current = resolvePendingOperation(operation.current, signature);
    try {
      const result = await bulkUpdateTestCases(http, {
        projectId: project.id,
        items,
        patch,
      }, operation.current.key);
      state.setData((current) => ({
        ...current,
        testCases: reconcileCaseSummaries(current.testCases, result.items),
      }));
      if (result.items.some((item) => item.id === state.selectedCaseId)) {
        state.retrySelectedCaseDetail();
      }
      operation.current = null;
      notify(ru
        ? `Обновлено: ${result.updatedCount}; без изменений: ${result.unchangedCount}.`
        : `Updated: ${result.updatedCount}; unchanged: ${result.unchangedCount}.`);
      return { ok: true };
    } catch (error) {
      const failure = toTmsMutationFailure(error);
      if (shouldRefreshAfterBulkFailure(failure.code)) {
        await refreshSafely(project.id);
      }
      const fallback = ru
        ? "Не удалось изменить выбранные тест-кейсы."
        : "The selected test cases could not be updated.";
      const conflict = failure.code === "PRECONDITION_FAILED"
        ? (ru
          ? "Один из кейсов изменился на сервере. Список обновлён — проверьте выбор и повторите."
          : "A case changed on the server. The list was refreshed; review the selection and retry.")
        : bulkFailureInvalidatesSelection(failure.code)
          ? (ru
            ? "Состав выбранных кейсов изменился. Список обновлён — проверьте выбор и повторите."
            : "The selected case scope changed. The list was refreshed; review the selection and retry.")
        : formatTmsMutationFailure(failure, fallback);
      notify(conflict);
      return { ok: false, message: conflict };
    }
  }

  return {
    bulkChangeCaseLifecycle: (
      ids: string[],
      lifecycle: TestCaseRevision["lifecycle"],
    ) => execute(ids, { lifecycle }),
    bulkChangeCasePriority: (
      ids: string[],
      priority: TestCaseRevision["priority"],
    ) => execute(ids, { priority }),
  };
}
