import type { ImpactAnalysis, RepositoryInput } from "../../model/impact-types";
export const scope = { workspaceId: "workspace_qa", projectId: "project_qa" };
export function analysis(patch: Partial<ImpactAnalysis> = {}): ImpactAnalysis {
  return { ...scope, id: "analysis_qa", repositoryId: "repository_qa", change: {
    repository: "qa/backend", platform: "backend", sha: "a".repeat(40), baseSha: "b".repeat(40), branch: "main",
    prNumber: 12, author: "QA", sourceUrl: "https://github.com/qa/backend/pull/12", workflowId: "build", workflowName: "Verify",
    workflowRunId: "900", workflowAttempt: 1, buildStatus: "success", buildUrl: "https://github.com/qa/backend/actions/runs/900", files: [], truncated: false,
  }, result: null, status: "complete", buildStatus: "success", builds: [], runId: "run_qa", scope: [],
  approved: false, canApprove: false, canEditScope: true, approvalBlockedReasons: [], gapActions: [], errorCode: null, rowVersion: 7,
  createdAt: "2026-09-07T12:00:00Z", updatedAt: "2026-09-07T12:00:00Z", ...patch };
}
export const repository: RepositoryInput = { connectionId: "connection_github", repository: "qa/ios", platform: "ios",
  enabled: false, environmentId: "environment_qa", branches: ["main"], workflows: ["verify.yml"], mappings: [], sensitivePaths: ["auth/"] };
export function storageFixture() {
  const records = new Map<string, string>();
  return { records, getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => { records.set(key, value); }, removeItem: (key: string) => { records.delete(key); } };
}
