import type {
  Suite,
  TestCaseSummary,
} from "../../../../core/tms/contracts/legacy-contract";

export function matchesSuite(item: TestCaseSummary, suite: Suite): boolean {
  if (suite.type === "static") return suite.caseIds.includes(item.id);
  const required = suite.filter.tags ?? [];
  return required.every((tagName) =>
    item.tags.includes(tagName),
  );
}
