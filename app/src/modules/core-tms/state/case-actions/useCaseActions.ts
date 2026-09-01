import { useRef } from "react";
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
import { uploadEvidence } from "../../application/evidence/uploadEvidence";
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
    state.setSelectedCaseDetail(testCase);
    state.setSelectedCaseEtag(etag);
  }

  function openNewCase(folderPath = state.selectedFolder || "/Unsorted") {
    if (state.isCaseSubmitting()) return;
    caseOperation.current = null;
    state.setCaseDraft(createEmptyRevision(locale));
    state.setCaseFolderPath(folderPath);
    state.setEditing(false);
    state.setDialog("case");
  }

  function openEditCase() {
    if (state.isCaseSubmitting() || !derived.selectedRevision) return;
    caseOperation.current = null;
    state.setCaseDraft(structuredClone(derived.selectedRevision));
    state.setCaseFolderPath(derived.selectedCase?.folderPath ?? "/Unsorted");
    state.setEditing(true);
    state.setDialog("case");
  }

  async function saveCase(event: FormEvent, files: File[] = []) {
    event.preventDefault();
    if (!derived.project || !state.caseDraft.title.trim() || !state.beginCaseSubmission()) return;
    const input = {
      projectId: derived.project.id,
      folderPath: state.caseFolderPath || "/Unsorted",
      revision: { ...state.caseDraft, tags: normalizeRevisionTags(state.caseDraft.tags) },
    };
    let caseCommitted = false;
    try {
      if (state.connection === "demo") {
        const now = new Date().toISOString();
        const previous = state.editing ? state.selectedCaseDetail : null;
        const revision = { ...input.revision, revision: previous ? previous.currentRevision + 1 : 1, createdAt: now };
        const testCase: TestCase = previous
          ? { ...previous, folderPath: input.folderPath, currentRevision: revision.revision, revisionCount: previous.revisionCount + 1, current: revision, title: revision.title, type: revision.type, lifecycle: revision.lifecycle, priority: revision.priority, component: revision.component, ownerIdentityId: revision.ownerIdentityId, tags: revision.tags, estimatedMinutes: revision.estimatedMinutes, updatedAt: now }
          : { id: createUid("case"), projectId: derived.project.id, key: `${derived.project.key}-TC-${String(derived.projectCases.length + 1).padStart(3, "0")}`, folderPath: input.folderPath, currentRevision: 1, revisionCount: 1, title: revision.title, type: revision.type, lifecycle: revision.lifecycle, priority: revision.priority, component: revision.component, ownerIdentityId: revision.ownerIdentityId, tags: revision.tags, estimatedMinutes: revision.estimatedMinutes, current: revision, linkIds: [], archivedAt: null, createdAt: now, updatedAt: now };
        commit(testCase, null, !previous);
        caseCommitted = true;
      } else {
        const signature = JSON.stringify({
          caseId: state.editing ? derived.selectedCase?.id ?? null : null,
          etag: state.editing ? state.selectedCaseEtag : null,
          input,
        });
        caseOperation.current = resolvePendingOperation(caseOperation.current, signature);
        const key = caseOperation.current.key;
        const result = state.editing && derived.selectedCase
          ? state.selectedCaseEtag
            ? await reviseTestCase(http, derived.selectedCase.id, input, state.selectedCaseEtag, key)
            : null
          : await createTestCase(http, input, key);
        if (!result) throw new Error("missing case precondition");
        let refreshed = await getTestCase(http, result.data.id);
        commit(refreshed.data, refreshed.etag, !state.editing);
        caseCommitted = true;
        if (files.length > 0) {
          await uploadEvidence({
            client: attachments,
            projectId: refreshed.data.projectId,
            owner: {
              kind: "test_case_revision",
              caseId: refreshed.data.id,
              revisionNo: refreshed.data.currentRevision,
            },
            files,
            operationKeyPrefix: `${key}:evidence`,
          });
          refreshed = await getTestCase(http, refreshed.data.id);
          commit(refreshed.data, refreshed.etag);
        }
      }
    } catch (caught) {
      if (caseCommitted) {
        state.setDialog(null);
        notify(formatTmsMutationFailure(
          toTmsMutationFailure(caught), t("runs.evidenceUploadError"),
        ));
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
    state.setDialog(null);
    notify(state.editing ? t("actions.caseRevisionSaved") : t("actions.caseCreated"));
  }

  async function cloneCase() {
    if (!derived.selectedCase) return;
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

  return { openNewCase, openEditCase, saveCase, cloneCase, toggleArchiveCase };
}
