import type { CaseListRow } from "../../types";
import type { CaseQueryNode, CaseQlTerm } from "./parse";
import { normalizeQueryText, valueAliases, type CaseQlField } from "./vocabulary/fields";
export type QueryMember = { id: string; name: string; email?: string | null };
export type CaseQueryContext = { members?: ReadonlyMap<string, QueryMember> };
export function caseSearchValues(row: CaseListRow, context: CaseQueryContext = {}): Record<CaseQlField, string[]> {
 const item = row.testCase; const person = item.ownerIdentityId ? context.members?.get(item.ownerIdentityId) : undefined;
 const owner = item.ownerIdentityId ? [item.ownerIdentityId, person?.name ?? "", person?.email ?? ""] : [...valueAliases.unassigned];
 return { text: [item.key, item.title, row.folderPath, item.component, ...item.tags, ...owner], key: [item.key], title: [item.title],
  lifecycle: [...(valueAliases[item.archivedAt ? "archived" : item.lifecycle] ?? [item.lifecycle])],
  priority: [...(valueAliases[item.priority] ?? [item.priority])], component: [item.component], folder: [row.folderPath],
  tag: item.tags, type: [...(valueAliases[item.type] ?? [item.type])], owner };
}
export function matchesCaseQuery(node: CaseQueryNode | null, values: Record<CaseQlField, string[]>): boolean {
 if (!node) return true;
 if (node.kind === "not") return !matchesCaseQuery(node.child, values);
 if (node.kind === "and") return matchesCaseQuery(node.left, values) && matchesCaseQuery(node.right, values);
 if (node.kind === "or") return matchesCaseQuery(node.left, values) || matchesCaseQuery(node.right, values);
 const term: CaseQlTerm = node.term; const needle = normalizeQueryText(term.value);
 const exact = term.exact || ["lifecycle", "priority", "type"].includes(term.field);
 return values[term.field].some(value => exact ? normalizeQueryText(value) === needle : normalizeQueryText(value).includes(needle));
}
