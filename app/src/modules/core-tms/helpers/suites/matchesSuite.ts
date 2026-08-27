import type {
  Suite,
  TestCase,
} from "../../../../core/tms/contracts/legacy-contract";
import { latestRevision } from "../cases/caseRevision";

export function matchesSuite(item: TestCase, suite: Suite): boolean {
  if (suite.type === "static") return suite.caseIds.includes(item.id);
  const required = suite.filter.tags ?? [];
  return required.every((tagName) =>
    latestRevision(item).tags.includes(tagName),
  );
}
