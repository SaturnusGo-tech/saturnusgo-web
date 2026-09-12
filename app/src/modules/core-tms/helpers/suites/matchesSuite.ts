import type { Suite, TestCaseSummary } from "../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../folders/model/folder";

type Membership = Pick<Suite, "projectId" | "type" | "caseIds" | "filter">;
export function matchesSuite(item: TestCaseSummary, suite: Membership, folders: readonly RepositoryFolder[] = [], textMatches?: ReadonlySet<string>): boolean {
  if (item.projectId !== suite.projectId || item.archivedAt) return false;
  if (suite.type === "static") return suite.caseIds.includes(item.id);
  const rule = suite.filter;
  if (!((rule.tags ?? []).every(tag => item.tags.includes(tag)))) return false;
  if (rule.priority?.length && !rule.priority.includes(item.priority)) return false;
  if (rule.lifecycle?.length && !rule.lifecycle.includes(item.lifecycle)) return false;
  const folder = rule.folderId ? folders.find(value => value.id === rule.folderId && value.projectId === suite.projectId && !value.archivedAt) : undefined;
  if (rule.folderId && !folder) return false;
  const path = folder?.path ?? rule.folderPathPrefix;
  if (path && path !== "/" && item.folderPath !== path && !item.folderPath.startsWith(`${path}/`)) return false;
  // Text criteria include revision descriptions, which are deliberately absent from case summaries.
  return !rule.text?.trim() || Boolean(textMatches?.has(item.id));
}
