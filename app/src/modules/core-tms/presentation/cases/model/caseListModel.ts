import type { TestCaseSummary } from "../../../../../core/tms/contracts/legacy-contract";
import type { CaseListRow, CaseSort } from "../types";

const priorityRank = { low: 0, medium: 1, high: 2, critical: 3 } as const;
const lifecycleRank = { draft: 0, ready: 1, deprecated: 2, archived: 3 } as const;

export function flattenCaseGroups(
  groups: Array<[string, TestCaseSummary[]]>,
): CaseListRow[] {
  return groups.flatMap(([folderPath, testCases]) =>
    testCases.map((testCase) => ({
      testCase,
      folderPath,
    })),
  );
}

export function sortCaseRows(
  rows: CaseListRow[],
  sort: CaseSort,
  languageTag: string,
): CaseListRow[] {
  const collator = new Intl.Collator(languageTag, {
    numeric: true,
    sensitivity: "base",
  });
  const direction = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((left, right) => {
    let comparison = 0;
    if (sort.key === "key") {
      comparison = collator.compare(left.testCase.key, right.testCase.key);
    } else if (sort.key === "title") {
      comparison = collator.compare(left.testCase.title, right.testCase.title);
    } else if (sort.key === "lifecycle") {
      comparison = lifecycleRank[left.testCase.lifecycle] - lifecycleRank[right.testCase.lifecycle];
    } else if (sort.key === "priority") {
      comparison = priorityRank[left.testCase.priority] - priorityRank[right.testCase.priority];
    } else if (sort.key === "component") {
      comparison = collator.compare(left.testCase.component, right.testCase.component);
    } else {
      comparison = (left.testCase.estimatedMinutes ?? Number.MAX_SAFE_INTEGER)
        - (right.testCase.estimatedMinutes ?? Number.MAX_SAFE_INTEGER);
    }
    return comparison === 0
      ? collator.compare(left.testCase.key, right.testCase.key)
      : comparison * direction;
  });
}
