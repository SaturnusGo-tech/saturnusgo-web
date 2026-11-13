import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { createReadingFixture } from "../docs-reading-fixture";
import type { ReadingRole } from "../fixtures/reading-access";

export function createReadingHttpClient(fixture: ReturnType<typeof createReadingFixture>, role: ReadingRole): TmsHttpClient {
  const meta = { hasMore: false, nextCursor: null, limit: 100 };
  const catalog = fixture.cases.map((item, i) => ({ id: item.caseId, title: item.title, projectId: "host", key: `HOST-TC-${i + 1}`,
    folderPath: i === 2 ? "Calendar/Recovery" : "Calendar", folderId: i === 2 ? "recovery" : "calendar", currentRevision: 1,
    type: "manual", lifecycle: "ready", priority: "high", component: "Calendar", ownerIdentityId: "qa", tags: [],
    estimatedMinutes: 5, revisionCount: 1, archivedAt: null, createdAt: "2026-11-12T03:00:00Z", updatedAt: "2026-11-12T03:00:00Z", etag: "1" }));
  const get = async (path: string, signal?: AbortSignal) => {
    signal?.throwIfAborted();
    if (path.includes("/actors")) return { data: [{ identityId: "qa", name: "Alex Morgan", kind: "human", email: null,
      role, presence: "online", lastSignedInAt: "2026-11-12T03:00:00Z", workspaceName: "Preview" }], meta };
    if (path.includes("/folders")) return { data: [{ id: "calendar", name: "Calendar", path: "Calendar", parentId: null, projectId: "host", workspaceId: "preview" },
      { id: "recovery", name: "Recovery", path: "Calendar/Recovery", parentId: "calendar", projectId: "host", workspaceId: "preview" }], meta };
    if (path.startsWith("/test-cases")) return { data: catalog, meta };
    if (path.includes("/reviews")) {
      if (!fixture.access.canEdit) throw Object.assign(new Error("Local review unavailable"), { status: 403, code: "PRODUCT_DOC_ACCESS_DENIED" });
      const id = /\/product-docs\/([^/?]+)\/reviews/.exec(path)?.[1];
      const doc = await fixture.api.get(fixture.scope, id ? decodeURIComponent(id) : "", { draft: true });
      return { data: { reviews: [], nextCursor: null, canRequest: false,
        currentDraftVersion: doc.draftVersion }, meta };
    }
    return { data: [], meta };
  };
  return { get, getResource: get,
    async mutateResource(path: string, method: string, body: { kind: string; id: string }) {
      if (path !== "/workspaces/preview/projects/host/product-docs/link-preview" || method !== "POST") {
        throw new Error("Local preview blocks transport mutations.");
      }
      const doc = fixture.docs.some(item => item.id === body.id)
        ? await fixture.api.get(fixture.scope, body.id) : null;
      const testcase = catalog.find(item => item.id === body.id);
      return { data: { kind: body.kind, title: doc?.title ?? testcase?.title ?? body.id, description: null,
        host: null, path: [], status: doc ? doc.publishedVersion ? "published" : "draft" : "ready", priority: testcase?.priority } };
    },
  } as unknown as TmsHttpClient;
}
