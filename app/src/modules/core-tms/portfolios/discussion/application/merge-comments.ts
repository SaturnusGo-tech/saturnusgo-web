import type { OrganizationComment } from "../model/discussion";

export function mergeDiscussionComments(page: readonly OrganizationComment[], confirmed: readonly OrganizationComment[]) {
  const items = new Map(confirmed.map((item) => [item.id, item]));
  page.forEach((item) => items.set(item.id, item));
  return [...items.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}
