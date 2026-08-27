import type {
  TestCase,
  TestCaseRevision,
  TestStep,
} from "../../../../core/tms/contracts/legacy-contract";
import { createUid } from "../id/createUid";

export function latestRevision(testCase: TestCase): TestCaseRevision {
  return (
    testCase.revisions.find(
      (item) => item.revision === testCase.currentRevision,
    ) ?? testCase.revisions[testCase.revisions.length - 1]!
  );
}

export function createEmptyRevision(): TestCaseRevision {
  return {
    revision: 1,
    title: "",
    description: "",
    preconditions: "",
    type: "manual",
    lifecycle: "draft",
    priority: "medium",
    component: "Core product",
    owner: "QA Team",
    tags: [],
    estimatedMinutes: 5,
    testData: "",
    steps: [
      {
        id: createUid("step"),
        order: 1,
        action: "",
        expectedResult: "",
        required: true,
      },
    ],
    checklist: [],
    attachmentIds: [],
    linkIds: [],
    changeNote: "Created in TMS",
    createdAt: new Date().toISOString(),
  };
}

export function executableSteps(revision: TestCaseRevision): TestStep[] {
  if (revision.type === "checklist") {
    return revision.checklist.map((item) => ({
      id: item.id,
      order: item.order,
      action: item.text,
      expectedResult: "The check is confirmed",
      required: item.required,
    }));
  }
  return revision.steps;
}
