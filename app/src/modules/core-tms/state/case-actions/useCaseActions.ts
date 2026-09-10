import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { TestCase, TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import {
  formatTmsMutationFailure,
  toTmsMutationFailure,
} from "../../../../core/tms/errors/mutation-failure";
import {
  resolvePendingOperation,
  type PendingOperation,
} from "../../../../core/tms/idempotency/pending-operation";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../attachments/presentation/context/AttachmentClientProvider";
import { pendingCaseAttachmentSignature, type PendingCaseAttachment, type CaseAttachmentProgress } from "../../application/evidence/case/pendingCaseAttachment";
import { saveCaseWithAttachments, type CaseSaveCheckpoint } from "../../application/evidence/case/save/saveCaseWithAttachments";
import { createEmptyRevision, normalizeRevisionTags } from "../../helpers/cases/caseRevision";
import { createUid } from "../../helpers/id/createUid";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import {
  cloneTestCase, createTestCase, getTestCase, reviseTestCase, transitionTestCase,
} from "../../test-cases/data/test-case-api";
import type { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";

function summaryOf(testCase: TestCase, etag: string): TestCaseSummary {
  const { current: _current, linkIds: _linkIds, ...summary } = testCase;
  return { ...summary, etag };
}

export function useCaseActions(
  state: ReturnType<typeof useWorkspaceState>,
  derived: ReturnType<typeof useWorkspaceDerived>,
  notify: (message: string) => void,
) {
  const http = useTmsHttpClient();
  const attachments = useAttachmentClient();
  const { locale, t } = useTmsLocale();
  const caseOperation = useRef<PendingOperation | null>(null);
  const saveCheckpoint = useRef<CaseSaveCheckpoint | null>(null);
  const [caseAttachmentRecovery, setCaseAttachmentRecovery] = useState(false);

  function commit(testCase: TestCase, etag: string | null, append = false) {
    const summary: TestCaseSummary = state.connection === "demo"
      ? summaryOf(testCase, "")
      : summaryOf(testCase, etag ?? "");
    state.setData((current) => ({
      ...current,
      testCases: append
        ? [...current.testCases, summary]
        : current.testCases.map((item) => item.id === summary.id ? summary : item),
    }));
    state.setSelectedCaseId(testCase.id);
    state.setSelectedFolder(testCase.folderPath);
    state.setSelectedFolderId(testCase.folderId ?? (testCase.folderPath === "/" ? "root" : ""));
    state.setSelectedCaseDetail(testCase);
    state.setSelectedCaseEtag(etag);
  }

  function openNewCase(folderPath = state.selectedFolder || "/Unsorted") {
    if (state.isCaseSubmitting()) return;
    caseOperation.current = null;
    saveCheckpoint.current = null;
    setCaseAttachmentRecovery(false);
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
    state.setCaseDraft(structuredClone(derived.selectedRevision));
    state.setCaseFolderPath(derived.selectedCase?.folderPath ?? "/Unsorted");
    state.setEditing(true);
    state.setDialog("case");
  }

  async function saveCase(event: FormEvent, files: PendingCaseAttachment[] = [], onProgress?: CaseAttachmentProgress) {
    event.preventDefault();
    if (state.editing && derived.selectedCase?.archivedAt) return;
    if (!derived.project || !state.caseDraft.title.trim() || !state.beginCaseSubmission()) return;
    const input = {
      projectId: derived.project.id,
      folderPath: state.caseFolderPath || "/Unsorted",
      revision: { ...state.caseDraft, tags: normalizeRevisionTags(state.caseDraft.tags) },
    };
    const validStepIds = new Set(input.revision.steps.map(({ id }) => id));
    const validFiles = files.filter(({ stepId }) => !stepId || validStepIds.has(stepId));

    try {
      if (state.connection === "demo") {
        const now = new Date().toISOString();
        const previous = state.editing ? state.selectedCaseDetail : null;
        const revision = { ...input.revision, revision: previous ? previous.currentRevision + 1 : 1, createdAt: now };
        const testCase: TestCase = previous
          ? { ...previous, folderPath: input.folderPath, currentRevision: revision.revision, revisionCount: previous.revisionCount + 1, current: revision, title: revision.title, type: revision.type, lifecycle: revision.lifecycle, priority: revision.priority, component: revision.component, ownerIdentityId: revision.ownerIdentityId, tags: revision.tags, estimatedMinutes: revision.estimatedMinutes, updatedAt: now }
          : { id: createUid("case"), projectId: derived.project.id, key: `${derived.project.key}-TC-${String(derived.projectCases.length + 1).padStart(3, "0")}`, folderPath: input.folderPath, currentRevision: 1, revisionCount: 1, title: revision.title, type: revision.type, lifecycle: revision.lifecycle, priority: revision.priority, component: revision.component, ownerIdentityId: revision.ownerIdentityId, tags: revision.tags, estimatedMinutes: revision.estimatedMinutes, current: revision, linkIds: [], archivedAt: null, createdAt: now, updatedAt: now };
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
        commit(refreshed.data, refreshed.etag, !state.editing);
      }
    } catch (caught) {
      for (const file of validFiles) if (!saveCheckpoint.current?.completed.has(file.id)) onProgress?.(file.id, "error");
      if (saveCheckpoint.current?.saved) {
        notify(formatTmsMutationFailure(toTmsMutationFailure(caught), locale === "ru"
          ? "Не удалось завершить сохранение вложений. Нажмите «Сохранить», чтобы повторить."
          : "Could not finish saving attachments. Select Save to retry."));
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
    if (!derived.selectedCase || !state.selectedCaseEtag) return;
    const restoring = Boolean(derived.selectedCase.archivedAt);
    try {
      const result = await transitionTestCase(
        http, derived.selectedCase.id, restoring ? "restore" : "archive",
        state.selectedCaseEtag, crypto.randomUUID(),
      );
      const refreshed = await getTestCase(http, result.data.id);
      commit(refreshed.data, refreshed.etag);
    } catch {
      notify(restoring ? t("actions.caseRestoreError") : t("actions.caseArchiveError"));
      return;
    }
    notify(restoring ? t("actions.caseRestored") : t("actions.caseArchived"));
  }

  return { caseAttachmentRecovery, openNewCase, openEditCase, saveCase, cloneCase, toggleArchiveCase };
}
