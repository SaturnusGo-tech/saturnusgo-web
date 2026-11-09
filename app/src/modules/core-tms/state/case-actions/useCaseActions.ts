import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { TestCase, TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import {
  formatTmsMutationFailure,
  isRequiredCustomFieldFailure,
  toTmsMutationFailure,
} from "../../../../core/tms/errors/mutation-failure";
import {
  resolvePendingOperation,
  type PendingOperation,
} from "../../../../core/tms/idempotency/pending-operation";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../attachments/presentation/context/AttachmentClientProvider";
import { filterPendingCaseAttachments, pendingCaseAttachmentSignature, type PendingCaseAttachment, type CaseAttachmentProgress } from "../../application/evidence/case/pendingCaseAttachment";
import { saveCaseWithAttachments, type CaseSaveCheckpoint } from "../../application/evidence/case/save/saveCaseWithAttachments";
import { createEmptyRevision, normalizeRevisionTags } from "../../helpers/cases/caseRevision";
import { createUid } from "../../helpers/id/createUid";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import {
  cloneTestCase, createTestCase, getTestCase, reviseTestCase, transitionTestCase,
} from "../../test-cases/data/test-case-api";
import type { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";
import { reconcileMaintenance } from "../../test-cases/maintenance/model/case-maintenance";
import type { DraftProductDocRequirement } from "../../product-docs/domain/product-docs";
import { useCaseDocumentation } from "./documentation/useCaseDocumentation";

export function useCaseActions(
  state: ReturnType<typeof useWorkspaceState>,
  derived: ReturnType<typeof useWorkspaceDerived>,
  notify: (message: string) => void,
) {
  const http = useTmsHttpClient();
  const attachments = useAttachmentClient();
  const { locale, t } = useTmsLocale();
  const caseOperation = useRef<PendingOperation | null>(null);
  const archiveOperation = useRef<PendingOperation | null>(null);
  const archivePending = useRef(false);
  const saveCheckpoint = useRef<CaseSaveCheckpoint | null>(null);
  const [caseAttachmentRecovery, setCaseAttachmentRecovery] = useState(false);
  const [caseRequiredFields, setCaseRequiredFields] = useState(false);
  const documentation = useCaseDocumentation(http, locale, notify);
  function commit(testCase: TestCase, etag: string | null, append = false) {
    const { current: _current, linkIds: _linkIds, ...fields } = testCase;
    const summary: TestCaseSummary = { ...fields, etag: state.connection === "demo" ? "" : etag ?? "" };
    state.setData((current) => ({
      ...current,
      testCases: append && !current.testCases.some(item => item.id === summary.id)
        ? [...current.testCases, summary]
        : current.testCases.map((item) => item.id === summary.id ? reconcileMaintenance(summary, item) : item),
    }));
    state.setSelectedCaseId(testCase.id);
    state.setSelectedFolder(testCase.folderPath);
    state.setSelectedFolderId(testCase.folderId ?? (testCase.folderPath === "/" ? "root" : ""));
    state.setSelectedCaseDetail(current => reconcileMaintenance(testCase, current));
    state.setSelectedCaseEtag(etag);
  }
  function openNewCase(folderPath = state.selectedFolder || "/Unsorted", requirement?: DraftProductDocRequirement) {
    if (state.isCaseSubmitting()) return;
    caseOperation.current = null;
    saveCheckpoint.current = null;
    setCaseAttachmentRecovery(false);
    setCaseRequiredFields(false);
    documentation.reset(requirement ? [requirement] : []);
    state.setCaseDraft(createEmptyRevision(locale));
    state.setCaseFolderPath(folderPath);
    state.setEditing(false);
    state.setDialog("case");
  }
  function openEditCase() {
    if (state.isCaseSubmitting() || !derived.selectedRevision || derived.selectedCase?.archivedAt) return;
    caseOperation.current = null;
    saveCheckpoint.current = null;
    setCaseAttachmentRecovery(false);
    setCaseRequiredFields(false);
    documentation.reset();
    state.setCaseDraft(structuredClone(derived.selectedRevision));
    state.setCaseFolderPath(derived.selectedCase?.folderPath ?? "/Unsorted");
    state.setEditing(true);
    state.setDialog("case");
  }

  async function saveCase(event: FormEvent, files: PendingCaseAttachment[] = [], onProgress?: CaseAttachmentProgress) {
    event.preventDefault();
    if (state.editing && derived.selectedCase?.archivedAt) return;
    if (!derived.project || !state.caseDraft.title.trim() || !state.beginCaseSubmission()) return;
    setCaseRequiredFields(false);
    const input = {
      projectId: derived.project.id,
      folderPath: state.caseFolderPath || "/Unsorted",
      revision: { ...state.caseDraft, tags: normalizeRevisionTags(state.caseDraft.tags) },
    };
    const validStepIds = new Set(input.revision.steps.map(({ id }) => id));
    const validFiles = filterPendingCaseAttachments(files, validStepIds, new Set(input.revision.checklist.map(({ id }) => id)));

    try {
      if (state.connection === "demo") {
        const now = new Date().toISOString();
        const previous = state.editing ? state.selectedCaseDetail : null;
        const revision = { ...input.revision, revision: previous ? previous.currentRevision + 1 : 1, createdAt: now };
        const testCase: TestCase = previous
          ? { ...previous, folderPath: input.folderPath, currentRevision: revision.revision, revisionCount: previous.revisionCount + 1, current: revision, title: revision.title, type: revision.type, lifecycle: revision.lifecycle, priority: revision.priority, priorityAssigned: revision.priorityAssigned, component: revision.component, ownerIdentityId: revision.ownerIdentityId, tags: revision.tags, estimatedMinutes: revision.estimatedMinutes, updatedAt: now }
          : { id: createUid("case"), projectId: derived.project.id, key: `${derived.project.key}-TC-${String(derived.projectCases.length + 1).padStart(3, "0")}`, folderPath: input.folderPath, currentRevision: 1, revisionCount: 1, title: revision.title, type: revision.type, lifecycle: revision.lifecycle, priority: revision.priority, priorityAssigned: revision.priorityAssigned, component: revision.component, ownerIdentityId: revision.ownerIdentityId, tags: revision.tags, estimatedMinutes: revision.estimatedMinutes, current: revision, linkIds: [], archivedAt: null, createdAt: now, updatedAt: now };
        commit(testCase, null, !previous);
      } else {
        const signature = JSON.stringify({
          caseId: state.editing ? derived.selectedCase?.id ?? null : null,
          etag: state.editing ? state.selectedCaseEtag : null,
          input,
          attachments: pendingCaseAttachmentSignature(validFiles),
        });
        if (!saveCheckpoint.current?.saved) caseOperation.current = resolvePendingOperation(caseOperation.current, signature);
        const key = saveCheckpoint.current?.saved ? saveCheckpoint.current.key : caseOperation.current!.key;
        if (saveCheckpoint.current?.key !== key) saveCheckpoint.current = { key, saved: null, completed: new Set() };
        const refreshed = await saveCaseWithAttachments({
          checkpoint: saveCheckpoint.current, files: validFiles, client: attachments, onProgress,
          onSaved: () => { if (validFiles.length) setCaseAttachmentRecovery(true); },
          save: async () => {
            const result = state.editing && derived.selectedCase
              ? state.selectedCaseEtag
                ? await reviseTestCase(http, derived.selectedCase.id, input, state.selectedCaseEtag, key) : null
              : await createTestCase(http, input, key);
            if (!result) throw new Error("missing case precondition");
            return result;
          },
          reload: (id) => getTestCase(http, id),
        });
        saveCheckpoint.current.saved = refreshed;
        commit(refreshed.data, refreshed.etag, !state.editing);
        setCaseAttachmentRecovery(false);
        if (!await documentation.save({
          workspaceId: state.data.workspace.id, projectId: refreshed.data.projectId,
        }, refreshed.data.id, refreshed.data.current, state.editing)) return;
      }
    } catch (caught) {
      for (const file of validFiles) if (!saveCheckpoint.current?.completed.has(file.id)) onProgress?.(file.id, "error");
      if (saveCheckpoint.current?.saved) {
        notify(formatTmsMutationFailure(toTmsMutationFailure(caught), locale === "ru"
          ? "Не удалось завершить сохранение вложений. Нажмите «Сохранить», чтобы повторить."
          : "Could not finish saving attachments. Select Save to retry."));
        return;
      }
      if (isRequiredCustomFieldFailure(caught)) {
        setCaseRequiredFields(true);
        return;
      }
      const fallback = state.editing
        ? t("actions.caseRevisionSaveError")
        : t("actions.caseCreateError");
      notify(formatTmsMutationFailure(toTmsMutationFailure(caught), fallback));
      return;
    } finally {
      state.finishCaseSubmission();
    }
    caseOperation.current = null;
    saveCheckpoint.current = null;
    setCaseAttachmentRecovery(false);
    documentation.reset();
    state.setDialog(null);
    notify(state.editing ? t("actions.caseRevisionSaved") : t("actions.caseCreated"));
  }
  async function cloneCase() {
    if (!derived.selectedCase || derived.selectedCase.archivedAt) return;
    try {
      if (state.connection === "demo") throw new Error("demo clone unavailable");
      const result = await cloneTestCase(http, derived.selectedCase.id, crypto.randomUUID());
      const refreshed = await getTestCase(http, result.data.id);
      commit(refreshed.data, refreshed.etag, true);
    } catch {
      notify(t("actions.caseCloneError"));
      return;
    }
    notify(t("actions.caseCloned"));
  }
  async function toggleArchiveCase() {
    if (archivePending.current || !derived.selectedCase || !state.selectedCaseEtag) return false;
    const restoring = Boolean(derived.selectedCase.archivedAt);
    const { id } = derived.selectedCase;
    const operation = restoring ? "restore" : "archive";
    const etag = state.selectedCaseEtag;
    const pending = resolvePendingOperation(archiveOperation.current, JSON.stringify([id, operation, etag]));
    archiveOperation.current = pending;
    archivePending.current = true;
    try {
      const receipt = await transitionTestCase(http, id, operation, etag, pending.key);
      commit(receipt.data, receipt.etag);
      archiveOperation.current = null;
    } catch {
      notify(restoring ? t("actions.caseRestoreError") : t("actions.caseArchiveError"));
      return false;
    } finally {
      archivePending.current = false;
    }
    notify(restoring ? t("actions.caseRestored") : t("actions.caseArchived"));
    return true;
  }

  return { caseAttachmentRecovery, caseRequiredFields, ...documentation.fields, openNewCase, openEditCase, saveCase, cloneCase, toggleArchiveCase };
}
