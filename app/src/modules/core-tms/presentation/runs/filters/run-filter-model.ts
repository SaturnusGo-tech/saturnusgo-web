export function matchesRunFilters(row: { projectId: string; item: { status: string; assigneeIdentityId?: string | null } },
  filters: { owner: string | null | undefined; projectIds: readonly string[]; result: string }) {
  return (!filters.projectIds.length || filters.projectIds.includes(row.projectId))
    && (filters.result === "all" || row.item.status === filters.result)
    && (filters.owner === undefined || (row.item.assigneeIdentityId ?? null) === filters.owner);
}
