import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import type { ApiSource, ApiSourceDraft } from "../../api-sources/model/api-source";
import type { SwaggerSpecification } from "../../connectors/model/swagger/swagger-specification";

export const previewWorkspace = "workspace_api_preview";
export const previewProject = "project_api_preview";
export const previewSpecification: SwaggerSpecification = {
  title: "Public request echo", version: "1.0.0", format: "openapi", operationCount: 1,
  fetchedAt: "2026-11-12T09:00:00Z", connectionVersion: 1,
  document: {
    openapi: "3.0.3", info: { title: "Public request echo", version: "1.0.0" },
    servers: [{ url: "https://httpbin.org" }],
    security: [{ demoBearer: [] }],
    components: { securitySchemes: { demoBearer: { type: "http", scheme: "bearer", description: "Use only the harmless value falcon-preview. Never enter a real token in this public echo service." } } },
    paths: { "/get": { get: { tags: ["Preview"], summary: "Echo a harmless GET request", operationId: "previewEcho",
      description: "Sends a public request to httpbin.org. It does not change customer data. Use only demo values.",
      parameters: [{ name: "message", in: "query", schema: { type: "string", default: "falcon-preview" }, description: "Harmless echo text" }],
      responses: { "200": { description: "Request URL, query parameters and headers echoed by the service", content: { "application/json": { schema: { type: "object", additionalProperties: true } } } } },
    } } },
  },
};

/** All source/project edits remain in memory. The only real network call is the explicit public GET in Swagger. */
export function createApiTestingFixture(): TmsHttpClient {
  let items: ApiSource[] = [
    { workspaceId: previewWorkspace, id: "source_payments", name: "Payments API", enabled: true, allProjects: false,
      projectIds: [previewProject], sourceUrl: "https://example.com/payments/openapi.json", authMode: "bearer", rowVersion: 3,
      checkedAt: "2026-11-12T09:00:00Z", credentialsConfigured: true },
    { workspaceId: previewWorkspace, id: "source_inventory", name: "Inventory API", enabled: false, allProjects: true,
      projectIds: [], sourceUrl: "https://example.com/inventory/openapi.yaml", authMode: "none", rowVersion: 1,
      checkedAt: "2026-11-12T08:00:00Z", credentialsConfigured: false },
  ];
  return {
    async get(path: string) {
      if (path.startsWith("/integrations/api-sources")) return { data: items.map(item => ({ ...item })), nextCursor: null };
      if (path.startsWith("/projects")) return { data: [
        { id: previewProject, workspaceId: previewWorkspace, name: "Booking Cloud", key: "BOOK", status: "active", checklist: [], rowVersion: 1 },
        { id: "project_mobile_preview", workspaceId: previewWorkspace, name: "Mobile app", key: "MOB", status: "active", checklist: [], rowVersion: 1 },
      ], meta: { hasMore: false, nextCursor: null, limit: 100 } };
      throw new Error(`Unsupported local preview request: ${path}`);
    },
    async mutateResource(path: string, method: string, draft: ApiSourceDraft) {
      if (!path.startsWith("/integrations/api-sources")) throw new Error("Preview writes are limited to API sources in memory.");
      await new Promise(resolve => setTimeout(resolve, 450));
      const parts = path.split("?")[0].split("/");
      const id = method === "PATCH" ? parts[parts.length - 1] : `source_preview_${items.length + 1}`;
      const previous = items.find(item => item.id === id);
      const { secrets, ...fields } = draft;
      const saved = { ...fields, id, workspaceId: previewWorkspace, rowVersion: (previous?.rowVersion ?? 0) + 1,
        checkedAt: new Date().toISOString(), credentialsConfigured: Object.values(secrets).some(Boolean) || previous?.credentialsConfigured || false };
      items = [...items.filter(item => item.id !== id), saved];
      return { data: saved };
    },
  } as unknown as TmsHttpClient;
}
