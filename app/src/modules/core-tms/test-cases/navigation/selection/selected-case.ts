import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";

export function resolveSelectedCase<T extends Pick<TestCaseSummary, "id" | "projectId">>(
  testCases: readonly T[],
  projectId: string | undefined,
  selectedCaseId: string | null,
) {
  if (!projectId || !selectedCaseId) return undefined;
  return testCases.find((item) => item.projectId === projectId && item.id === selectedCaseId);
}
