import type { FormEvent } from "react";
import type { TestCase } from "../../../../core/tms/contracts/legacy-contract";
import { mutate } from "../../../../core/tms/transport/http";
import { createEmptyRevision } from "../../helpers/cases/caseRevision";
import { createUid } from "../../helpers/id/createUid";
import type { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";

export function useCaseActions(
  state: ReturnType<typeof useWorkspaceState>,
  derived: ReturnType<typeof useWorkspaceDerived>,
  notify: (message: string) => void,
) {
  function openNewCase(
    folderPath = state.selectedFolder || "/Unsorted",
  ) {
    state.setCaseDraft(createEmptyRevision());
    state.setCaseFolderPath(folderPath);
    state.setEditing(false);
    state.setDialog("case");
  }

  function openEditCase() {
    if (!derived.selectedRevision) return;
    state.setCaseDraft(structuredClone(derived.selectedRevision));
    state.setCaseFolderPath(
      derived.selectedCase?.folderPath ?? "/Unsorted",
    );
    state.setEditing(true);
    state.setDialog("case");
  }

  async function saveCase(event: FormEvent) {
    event.preventDefault();
    if (!derived.project || !state.caseDraft.title.trim()) return;
    const stamp = new Date().toISOString();
    const payload = {
      projectId: derived.project.id,
      folderPath: state.caseFolderPath || "/Unsorted",
      ...state.caseDraft,
      tags: state.caseDraft.tags.filter(Boolean),
    };
    try {
      if (state.connection === "demo") throw new Error("development demo");
      const remote =
        state.editing && derived.selectedCase
          ? await mutate<TestCase>(
              `/test-cases/${derived.selectedCase.id}`,
              "PATCH",
              payload,
            )
          : await mutate<TestCase>("/test-cases", "POST", payload);
      state.setData((current) => ({
        ...current,
        testCases: state.editing
          ? current.testCases.map((item) =>
              item.id === remote.id ? remote : item,
            )
          : [...current.testCases, remote],
      }));
      state.setSelectedCaseId(remote.id);
      state.setSelectedFolder(remote.folderPath);
    } catch {
      if (state.connection !== "demo") {
        notify(
          state.editing
            ? "Could not save the new revision"
            : "Could not create the test case",
        );
        return;
      }
      if (state.editing && derived.selectedCase) {
        const nextRevision = {
          ...state.caseDraft,
          revision: derived.selectedCase.currentRevision + 1,
          createdAt: stamp,
        };
        state.setData((current) => ({
          ...current,
          testCases: current.testCases.map((item) =>
            item.id === derived.selectedCase!.id
              ? {
                  ...item,
                  currentRevision: nextRevision.revision,
                  revisions: [...item.revisions, nextRevision],
                  updatedAt: stamp,
                }
              : item,
          ),
        }));
      } else {
        const next: TestCase = {
          id: createUid("case"),
          projectId: derived.project.id,
          key: `${derived.project.key}-TC-${String(derived.projectCases.length + 1).padStart(3, "0")}`,
          folderPath: state.caseFolderPath || "/Unsorted",
          currentRevision: 1,
          revisions: [{ ...state.caseDraft, revision: 1, createdAt: stamp }],
          archivedAt: null,
          createdAt: stamp,
          updatedAt: stamp,
        };
        state.setData((current) => ({
          ...current,
          testCases: [...current.testCases, next],
        }));
        state.setSelectedCaseId(next.id);
        state.setSelectedFolder(next.folderPath);
      }
    }
    state.setDialog(null);
    notify(
      state.editing
        ? "New test case revision saved"
        : "Test case created",
    );
  }

  async function cloneCase() {
    if (!derived.selectedCase) return;
    try {
      if (state.connection === "demo") throw new Error("development demo");
      const remote = await mutate<TestCase>(
        `/test-cases/${derived.selectedCase.id}/clone`,
        "POST",
      );
      state.setData((current) => ({
        ...current,
        testCases: [...current.testCases, remote],
      }));
      state.setSelectedCaseId(remote.id);
    } catch {
      if (state.connection !== "demo") {
        notify("Could not clone the test case");
        return;
      }
      const clone = structuredClone(derived.selectedCase);
      clone.id = createUid("case");
      clone.key = `${derived.project?.key ?? "TMS"}-TC-${String(derived.projectCases.length + 1).padStart(3, "0")}`;
      clone.revisions = clone.revisions.map((item) => ({
        ...item,
        title: `${item.title} — copy`,
      }));
      state.setData((current) => ({
        ...current,
        testCases: [...current.testCases, clone],
      }));
      state.setSelectedCaseId(clone.id);
    }
    notify("Test case cloned");
  }

  async function toggleArchiveCase() {
    if (!derived.selectedCase) return;
    const restoring = Boolean(derived.selectedCase.archivedAt);
    try {
      if (state.connection === "demo") throw new Error("development demo");
      const remote = await mutate<TestCase>(
        restoring
          ? `/test-cases/${derived.selectedCase.id}/restore`
          : `/test-cases/${derived.selectedCase.id}`,
        restoring ? "POST" : "DELETE",
      );
      state.setData((current) => ({
        ...current,
        testCases: current.testCases.map((item) =>
          item.id === remote.id ? remote : item,
        ),
      }));
    } catch {
      if (state.connection !== "demo") {
        notify(
          restoring
            ? "Could not restore the test case"
            : "Could not archive the test case",
        );
        return;
      }
      state.setData((current) => ({
        ...current,
        testCases: current.testCases.map((item) =>
          item.id === derived.selectedCase!.id
            ? {
                ...item,
                archivedAt: restoring ? null : new Date().toISOString(),
              }
            : item,
        ),
      }));
    }
    notify(
      restoring
        ? "Test case restored"
        : "Test case archived — history preserved",
    );
  }

  return { openNewCase, openEditCase, saveCase, cloneCase, toggleArchiveCase };
}
