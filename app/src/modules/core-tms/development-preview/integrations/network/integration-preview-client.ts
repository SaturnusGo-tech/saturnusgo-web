import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { isProvider } from "../../../connectors/model/connector-types";
import { sampleConnection, sampleCatalog, sampleDeliveries, sampleLinks } from "../samples/connector-sample";
import { sampleProjects, sampleWorkspace, sampleYouTrack } from "../samples/youtrack-sample";
const origin = "https://integration-preview.invalid";
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { etag: '"sample-integration:1"' } });
/** Isolated sample transport. No network fallthrough, credentials, persistence or real writes. */
export function createIntegrationPreviewClient() {
  const send: typeof fetch = async (input, init) => {
    const request = input instanceof Request ? input : null;
    (init?.signal ?? request?.signal)?.throwIfAborted();
    const url = new URL(request?.url ?? String(input), origin), method = (init?.method ?? request?.method ?? "GET").toUpperCase();
    const scoped = url.origin === origin && !url.username && !url.password && url.searchParams.get("workspaceId") === sampleWorkspace;
    if (scoped) {
      const path = url.pathname.replace(/^\/api\/v1/, "");
      if (path === "/integrations/youtrack/configuration" && method === "GET") return json({ data: sampleYouTrack });
      if (path === "/integrations/youtrack/discovery" && method === "POST") return json({ data: { baseUrl: sampleYouTrack.baseUrl, projects: sampleProjects } });
      if (path === "/integrations/youtrack/webhook-setup" && method === "GET") return json({ data: {
        callbackUrl: "https://example.invalid/webhook/sample", connectionRevision: 1,
        authentication: { headerName: "X-YouTrack-Token", headerValue: "sample-only-not-a-real-secret" } } });
      if (method === "GET" && path === "/integrations/connectors") return json({ data: ["github", "confluence", "slack"].map(p => sampleConnection(p as "github" | "confluence" | "slack")) });
      if (method === "GET" && path === "/integrations/connectors/catalog" && url.searchParams.get("projectId") === "project-0") return json({ data: sampleCatalog });
      const match = path.match(/^\/integrations\/connectors\/([a-z]+)\/(configuration|webhook-setup|deliveries|links|discovery)$/);
      if (match && isProvider(match[1]!) && url.searchParams.get("projectId") === "project-0") {
        const provider = match[1]!, suffix = match[2];
        if (method === "GET" && suffix === "configuration") return json({ data: sampleConnection(provider) });
        if (method === "GET" && suffix === "webhook-setup") return json({ data: { url: "https://example.invalid/callback/sample", configured: true } });
        if (method === "GET" && suffix === "deliveries") return json({ data: sampleDeliveries, nextCursor: null });
        if (method === "GET" && suffix === "links") return json({ data: sampleLinks(provider) });
        if (method === "POST" && suffix === "discovery") return json({ data: { account: "Sample QA team", resources: [{ id: "sample-team", name: "Payments · Platform and infrastructure" }],
          destinations: [{ id: "sample-destination", name: "Payments · Release verification reports" }], statuses: ["Open", "In progress", "Ready for retest", "Verified"].map(name => ({ id: name, name })) } });
      }
      if (method === "GET" && path === "/integrations/api-sources") return json({ data: [], nextCursor: null });
      if (method === "GET" && path === "/projects") return json({ data: sampleProjects.map(p => ({ id: p.id, workspaceId: sampleWorkspace, name: p.name,
        key: p.shortName, description: "", active: true, createdAt: "2026-11-12T09:00:00Z", updatedAt: "2026-11-12T09:00:00Z", rowVersion: 1 })), meta: { hasMore: false, nextCursor: null } });
      if (method === "GET" && /^\/impact\/(repositories|analyses)$/.test(path) && url.searchParams.get("projectId") === "project-0") return json({ data: [], nextCursor: null });
    }
    return json({ error: { code: "ACCESS_DENIED", requestId: "sample-only", message: "Real requests and changes are disabled in this local sample." } }, 403);
  };
  return { fetch: send, http: createTmsHttpClient({ apiBase: `${origin}/api/v1`, credentials: "include", production: false, fetch: send }) };
}
