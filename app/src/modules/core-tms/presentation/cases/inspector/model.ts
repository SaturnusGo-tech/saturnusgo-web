import type { FormEvent } from "react";
import type { TestCaseRevision } from "../../../../../core/tms/contracts/legacy-contract";
import type { PendingCaseAttachment } from "../../../application/evidence/case/pendingCaseAttachment";
import { revisionTagsAreValid } from "../../../helpers/cases/caseRevision";

export type InspectorSection =
  | "description" | "component" | "preconditions" | "details" | "steps";
export type InspectorTabId = "overview" | "files" | "activity";
export type InspectorTabKey = "ArrowLeft" | "ArrowRight" | "Home" | "End";
export type InspectorRevisionProblem =
  | "title" | "folder" | "tags" | "manualSteps" | "automatedSteps" | "checklist";

const INSPECTOR_TAB_ORDER: InspectorTabId[] = ["overview", "files", "activity"];

export function inspectorSectionForMode(mode?: CaseInspectorEditor["mode"]) {
  return mode === "create" ? "description" as const : null;
}

export function isInspectorSectionEditing(
  mode: CaseInspectorEditor["mode"] | undefined,
  active: InspectorSection | ReadonlySet<InspectorSection> | null,
  section: InspectorSection,
) {
  return mode === "create" || active === section
    || (typeof active === "object" && active !== null && active.has(section));
}

export function inspectorTabsForMode(creating: boolean): InspectorTabId[] {
  return creating ? ["overview"] : [...INSPECTOR_TAB_ORDER];
}

export function canRemoveInspectorRow(count: number) { return count > 1; }

export type CaseInspectorEditor = {
  mode: "edit" | "create";
  value: TestCaseRevision;
  folderPath: string;
  folders: string[];
  components: string[];
  onChange: (next: TestCaseRevision) => void;
  onFolderPath: (next: string) => void;
  onSubmit: (event: FormEvent, files: PendingCaseAttachment[]) => void;
  onCancel: () => void;
  submitting?: boolean;
};

export function inspectorTabAfterKey(
  current: InspectorTabId,
  key: InspectorTabKey,
): InspectorTabId {
  if (key === "Home") return INSPECTOR_TAB_ORDER[0];
  if (key === "End") return INSPECTOR_TAB_ORDER[INSPECTOR_TAB_ORDER.length - 1];
  const offset = key === "ArrowRight" ? 1 : -1;
  const index = INSPECTOR_TAB_ORDER.indexOf(current);
  return INSPECTOR_TAB_ORDER[
    (index + offset + INSPECTOR_TAB_ORDER.length) % INSPECTOR_TAB_ORDER.length
  ];
}

export function editorSessionClosed(wasOpen: boolean, isOpen: boolean) {
  return wasOpen && !isOpen;
}

export function inspectorRevisionProblem(
  revision: TestCaseRevision,
  folderPath: string,
): InspectorRevisionProblem | null {
  if (!revision.title.trim()) return "title";
  if (!folderPath.trim()) return "folder";
  if (!revisionTagsAreValid(revision.tags)) return "tags";
  if (revision.type !== "checklist") {
    const complete = revision.steps.every((step) => (
      step.action.trim() && step.expectedResult.trim()
    ));
    if (revision.type === "automated") {
      return revision.steps.length > 0 && complete ? null : "automatedSteps";
    }
    return revision.steps.length > 0 && complete ? null : "manualSteps";
  }
  return revision.checklist.length > 0
    && revision.checklist.every((item) => item.text.trim()) ? null : "checklist";
}

export function copyInspectorRevision(revision: TestCaseRevision): TestCaseRevision {
  return {
    ...revision,
    tags: [...revision.tags],
    attachmentIds: [...revision.attachmentIds],
    steps: revision.steps.map((step) => ({
      ...step,
      attachmentIds: step.attachmentIds ? [...step.attachmentIds] : undefined,
    })),
    checklist: revision.checklist.map((item) => ({ ...item })),
  };
}

export function restoreInspectorSection(
  current: TestCaseRevision,
  snapshot: TestCaseRevision,
  section: InspectorSection,
): TestCaseRevision {
  if (section === "description") return { ...current, description: snapshot.description };
  if (section === "component") return { ...current, component: snapshot.component };
  if (section === "preconditions") return { ...current, preconditions: snapshot.preconditions };
  if (section === "details") return {
    ...current,
    testData: snapshot.testData,
    ownerIdentityId: snapshot.ownerIdentityId,
    tags: [...snapshot.tags],
    changeNote: snapshot.changeNote,
  };
  return {
    ...current,
    steps: snapshot.steps.map((step) => ({ ...step })),
    checklist: snapshot.checklist.map((item) => ({ ...item })),
  };
}
