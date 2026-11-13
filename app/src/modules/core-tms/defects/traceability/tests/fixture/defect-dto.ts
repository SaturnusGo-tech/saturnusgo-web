import type { components } from "../../../../../../core/tms/generated/tms-api";

export const defectDto = {
  id: "bug-1", projectId: "project-1", key: "BUG-1", title: "Checkout fails",
  description: "Observed checkout failure", preconditions: "", testData: "",
  severity: "high", priority: "high", status: "open", reproducibility: "always",
  assigneeIdentityId: null, component: "Checkout", integrationTarget: null, externalIssue: null,
  labels: [], occurrence: { id: "occurrence-1", runId: "run-1", runItemId: "item-1", attemptNo: 1,
    stepId: "shared-child", createdAt: "2026-11-13T00:00:00Z" },
  expectedResult: "Payment succeeds", actualResult: "Payment fails", attachmentIds: [], linkIds: [],
  sourceCaseId: "case-1", sourceLocation: {
    folderId: "folder-1", folderPath: "/Payments", capturedAt: "2026-11-13T00:00:00Z", origin: "run",
  },
  reproduction: { origin: "run", caseId: "case-1", caseRevision: 3, steps: [
    { id: "shared-child", order: 1, action: "Submit payment", expectedResult: "Accepted", testData: "key-1",
      required: true, sharedStep: { id: "shared-1", title: "Payment authorization", revision: 2 }, failed: true },
  ] },
  createdByIdentityId: "identity-1", createdAt: "2026-11-13T00:00:00Z", updatedAt: "2026-11-13T00:00:00Z",
} satisfies components["schemas"]["Defect"];
