export function runScopeState(loading: boolean, itemCount: number) {
  if (loading) return "loading";
  return itemCount === 0 ? "empty" : "ready";
}
