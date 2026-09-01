export type SelectionCoverage = "none" | "some" | "all";

function unique(ids: readonly string[]) {
  return Array.from(new Set(ids));
}

export function selectionCoverage(
  selected: ReadonlySet<string>,
  scopeIds: readonly string[],
): SelectionCoverage {
  const scope = unique(scopeIds);
  if (scope.length === 0) return "none";
  const count = scope.reduce(
    (total, id) => total + Number(selected.has(id)),
    0,
  );
  if (count === 0) return "none";
  return count === scope.length ? "all" : "some";
}

export function setScopeSelected(
  selected: ReadonlySet<string>,
  scopeIds: readonly string[],
  checked: boolean,
) {
  const next = new Set(selected);
  unique(scopeIds).forEach((id) => {
    if (checked) next.add(id);
    else next.delete(id);
  });
  return next;
}

export function toggleScopeSelection(
  selected: ReadonlySet<string>,
  scopeIds: readonly string[],
) {
  return setScopeSelected(
    selected,
    scopeIds,
    selectionCoverage(selected, scopeIds) !== "all",
  );
}

export function reconcileSelection(
  selected: ReadonlySet<string>,
  availableIds: readonly string[],
) {
  const available = new Set(availableIds);
  const next = new Set(Array.from(selected).filter((id) => available.has(id)));
  if (
    next.size === selected.size
    && Array.from(next).every((id) => selected.has(id))
  ) return selected;
  return next;
}

export function selectedIdsInOrder(
  selected: ReadonlySet<string>,
  orderedIds: readonly string[],
) {
  return unique(orderedIds).filter((id) => selected.has(id));
}
