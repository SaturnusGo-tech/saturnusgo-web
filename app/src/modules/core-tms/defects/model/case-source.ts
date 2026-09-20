import type { TestCaseRevision, TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";

export type DefectCaseSource = {
  workspaceId: string;
  testCase: Pick<TestCaseSummary, "id" | "key" | "projectId">;
  revision: TestCaseRevision;
};
