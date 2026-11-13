import type { TestCase, TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { reconcileMaintenance } from "../../../test-cases/maintenance/model/case-maintenance";
import type { useWorkspaceState } from "../../workspace/useWorkspaceState";

type CaseCommitPort = Pick<ReturnType<typeof useWorkspaceState>, "connection" | "setData" | "setSelectedCaseId"
  | "setSelectedFolder" | "setSelectedFolderId" | "setSelectedCaseDetail" | "setSelectedCaseEtag">;

export function commitCaseToWorkspace(state: CaseCommitPort, testCase: TestCase, etag: string | null, append = false) {
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
