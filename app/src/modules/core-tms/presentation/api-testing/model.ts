export function swaggerWorkspaceUrl(current: string, view: "api" | "hooks"): string {
  const url = new URL(current);
  for (const key of ["caseId", "runId", "runItemId", "defectId", "article", "analysisId", "impact", "integration"]) url.searchParams.delete(key);
  url.searchParams.set("view", view);
  if (view === "hooks") url.searchParams.set("integration", "swagger");
  return url.toString();
}

const operationMethods = new Set(["get", "post", "put", "patch", "delete", "head", "options", "trace"]);
type ApiRecord = Record<string, unknown>;
const record = (value: unknown): ApiRecord | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as ApiRecord : null;
function localPathItem(document: ApiRecord, item: ApiRecord): ApiRecord | null {
  const visited = new Set<string>();
  for (let depth = 0; depth < 12; depth++) {
    if (typeof item.$ref !== "string") return item;
    const ref = item.$ref;
    if (!ref.startsWith("#/") || visited.has(ref)) return null;
    visited.add(ref);
    let target: unknown = document;
    try {
      for (const key of decodeURIComponent(ref.slice(2)).split("/").map(key => key.replace(/~1/g, "/").replace(/~0/g, "~"))) {
        const owner = record(target);
        if (!owner || !Object.prototype.hasOwnProperty.call(owner, key)) return null;
        target = owner[key];
      }
    } catch { return null; }
    const resolved = record(target);
    if (!resolved) return null;
    item = resolved;
  }
  return null;
}
function operationMatches(method: string, operation: unknown, needle: string) {
  const value = record(operation);
  return Boolean(value && [method, value.summary, value.description, ...(Array.isArray(value.tags) ? value.tags : [])]
    .some(text => typeof text === "string" && text.toLocaleLowerCase().includes(needle)));
}
export function filterApiOperations<T extends ApiRecord>(document: T, query: string): T {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return document;
  const paths = Object.fromEntries(Object.entries(record(document.paths) ?? {}).flatMap(([path, rawItem]) => {
    const item = record(rawItem);
    if (!item) return [];
    const pathMatch = path.toLocaleLowerCase().includes(needle);
    if (typeof item.$ref === "string") {
      const resolved = localPathItem(document, item);
      const matches = pathMatch || [item, resolved].some(value => value && Object.entries(value)
        .some(([method, operation]) => operationMethods.has(method) && operationMatches(method, operation, needle)));
      // Keep the reference intact so Swagger resolves the same shared Path Item.
      return matches ? [[path, rawItem]] : [];
    }
    const entries = Object.entries(item).filter(([method, operation]) => !operationMethods.has(method)
      || record(operation) && (pathMatch || operationMatches(method, operation, needle)));
    return entries.some(([method]) => operationMethods.has(method)) ? [[path, Object.fromEntries(entries)]] : [];
  }));
  return { ...document, paths };
}
