type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const methods = new Set(["get", "post", "put", "patch", "delete", "head", "options", "trace"]);
function serverUrl(value: unknown, baseUrl: string) {
  const server = record(value); if (typeof server.url !== "string") return null;
  const variables = record(server.variables); let valid = true;
  const expanded = server.url.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const defaultValue = record(variables[key]).default;
    if (typeof defaultValue !== "string" && typeof defaultValue !== "number") { valid = false; return ""; }
    return String(defaultValue);
  });
  if (!valid) return null;
  try { return new URL(expanded, baseUrl).href.replace(/\/$/, ""); } catch { return null; }
}
export function apiServers(document: unknown, sourceUrl: string): string[] {
  const doc = record(document); const servers: unknown[] = Array.isArray(doc.servers) ? [...doc.servers] : [];
  for (const path of Object.values(record(doc.paths))) {
    const item = record(path); if (Array.isArray(item.servers)) servers.push(...item.servers);
    for (const [method, operation] of Object.entries(item)) if (methods.has(method) && Array.isArray(record(operation).servers)) servers.push(...record(operation).servers as unknown[]);
  }
  if (doc.swagger === "2.0") {
    const schemes = Array.isArray(doc.schemes) ? doc.schemes : [new URL(sourceUrl).protocol.replace(":", "")];
    for (const scheme of schemes) servers.push({ url: `${scheme}://${doc.host || new URL(sourceUrl).host}${doc.basePath || "/"}` });
  } else if (!servers.length) servers.push({ url: "/" });
  return [...new Set(servers.map(server => serverUrl(server, sourceUrl)).filter((url): url is string => Boolean(url)))];
}
export function documentForServer(document: RecordValue, server: string): RecordValue {
  if (!server) return document;
  const copy = structuredClone(document);
  if (copy.swagger === "2.0") { const url = new URL(server); copy.host = url.host; copy.schemes = [url.protocol.replace(":", "")]; copy.basePath = url.pathname; }
  else {
    copy.servers = [{ url: server }];
    for (const value of Object.values(record(copy.paths))) {
      const path = record(value); delete path.servers;
      for (const [method, operation] of Object.entries(path)) if (methods.has(method)) delete record(operation).servers;
    }
  }
  return copy;
}
export function requireSelectedServer(url: string, server: string) {
  if (!server) throw new Error("Select an API server before sending a request.");
  const target = new URL(url); const selected = new URL(server); const base = selected.pathname.replace(/\/$/, "");
  if (target.origin !== selected.origin || base && target.pathname !== base && !target.pathname.startsWith(`${base}/`)) throw new Error("The request does not belong to the selected API server.");
}
