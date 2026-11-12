import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import type { components } from "../../../../core/tms/generated/tms-api";
import type { PrivateAttachmentClient } from "../../attachments/application/private-attachment-client";
import type { AttachmentMetadata } from "../../attachments/domain/attachment";

type Api = components["schemas"];
export const exchangeWorkspace = "preview-exchange";
const at = "2026-11-12T10:00:00.000Z";
export const exchangeProjects: Api["Project"][] = [
  { id: "booking-cloud", key: "BOOK", name: "BookingCloud", slug: "booking-cloud", description: "Booking and payment coverage" },
  { id: "falcon-guide", key: "GUIDE", name: "Falcon Guide", slug: "falcon-guide", description: "Product guide and release coverage" },
].map(project => ({ ...project, workspaceId: exchangeWorkspace, status: "active", createdAt: at, updatedAt: at,
  portfolioId: null, responsibleIdentityId: null, rowVersion: 1, testingPlan: "", workflowPhase: "new", checklist: [] } satisfies Api["Project"]));

export function createExchangeFixture(log: (message: string) => void) {
  const rows: [string, string, string | null, string][] = [
    ["booking-cloud", "booking", null, "/Bookings"], ["booking-cloud", "payments", "booking", "/Bookings/Payments"],
    ["booking-cloud", "authentication", null, "/Authentication"], ["falcon-guide", "product", null, "/Product guide"],
    ["falcon-guide", "releases", "product", "/Product guide/Releases"],
  ];
  const folders: Api["RepositoryFolder"][] = rows.map(([projectId, id, parentId, path]) => ({ id, projectId, parentId,
    path, name: path.split("/").pop() ?? path, workspaceId: exchangeWorkspace, rowVersion: 1,
    archivedAt: null, createdAt: at, updatedAt: at, etag: '"preview:1"', appearance: null }));
  const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const text = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
  function makeCase(request: Api["TestCaseCreateRequest"], index: number): Api["TestCase"] {
    const id = `case-preview-${index}`;
    return { id, projectId: request.projectId, key: `${exchangeProjects.find(p => p.id === request.projectId)?.key}-TC-${index}`,
      folderPath: request.folderPath, folderId: folders.find(f => f.projectId === request.projectId && f.path === request.folderPath)?.id ?? null,
      currentRevision: 1, revisionCount: 1, linkIds: [], archivedAt: null, createdAt: at, updatedAt: at,
      maintenance: { status: "current", rowVersion: 1, updatedBy: null, updatedAt: null, note: null, source: null, etag: '"maintenance:1"' },
      current: { revision: 1, title: request.title, description: request.description ?? "", preconditions: request.preconditions ?? "",
        type: request.type, lifecycle: request.lifecycle ?? "draft", priority: request.priority ?? "medium",
        ...(!request.priority ? { priorityAssigned: false as const } : {}), component: request.component ?? "", ownerIdentityId: null,
        tags: request.tags ?? [], estimatedMinutes: request.estimatedMinutes ?? null, testData: request.testData ?? "",
        steps: (request.steps ?? []).map((step, i) => ({ ...step, id: `${id}-step-${i}`, order: step.order ?? i + 1, required: step.required ?? true,
          attachmentIds: [], sharedStepId: null, sharedStep: null })),
        checklist: (request.checklist ?? []).map((item, i) => ({ ...item, id: `${id}-check-${i}`, order: item.order ?? i + 1, required: item.required ?? true })),
        attachmentIds: [], changeNote: request.changeNote ?? "", createdBy: "preview-human", createdAt: at, customFields: [], productGroupId: null, productId: null, regression: false } };
  }
  const cases = [makeCase({ projectId: "booking-cloud", folderPath: "/Bookings", title: "Open the booking calendar", type: "manual" }, 1),
    makeCase({ projectId: "booking-cloud", folderPath: "/Bookings/Payments", title: "Review a paid booking", type: "manual" }, 2),
    makeCase({ projectId: "falcon-guide", folderPath: "/Product guide/Releases", title: "Read the release guide", type: "manual" }, 3)];
  const originals = new Map<string, { file: File; metadata: AttachmentMetadata; url: string }>();
  const uploads = new Map<string, string>();
  const history: Api["ImportFile"][] = [];
  const receipts = new Map<string, unknown>();
  const meta = { hasMore: false, nextCursor: null, limit: 100 };
  function inspect(source: unknown) {
    const records: { path: string; value: unknown; context: string[] }[] = [];
    function visit(value: unknown, path: string) {
      if (typeof object(value).title === "string") { records.push({ path, value, context: [] }); return; }
      if (value && typeof value === "object") Object.entries(value).forEach(([key, child]) => visit(child, `${path}/${key.replace(/~/g, "~0").replace(/\//g, "~1")}`));
    }
    visit(source, ""); return records;
  }
  const http = createTmsHttpClient({ apiBase: "http://127.0.0.1:4683/api/preview", production: false, credentials: "include",
    fetch: async (input, init) => {
      init?.signal?.throwIfAborted(); await new Promise(resolve => setTimeout(resolve, 90)); init?.signal?.throwIfAborted();
      const url = new URL(String(input)); const path = url.pathname.replace("/api/preview", ""); const method = init?.method ?? "GET";
      const body = object(typeof init?.body === "string" ? JSON.parse(init.body) : undefined);
      const project = exchangeProjects.find(item => item.id === path.split("/")[2]);
      const scopeProject = path.split("/")[4];
      const key = new Headers(init?.headers).get("Idempotency-Key"); const replay = key ? receipts.get(`${path}:${key}`) : undefined;
      let result: unknown = replay;
      if (replay === undefined) {
        if (path === "/test-case-import/inspect") { log(`PREPARE inspect ${text(body.projectId)}`); result = { data: { records: inspect(body.source), selectors: [] } }; }
        else if (path === "/test-case-import/normalize") {
          log(`PREPARE normalize ${text(body.projectId)} folders=${JSON.stringify(body.folders)}`);
          const records = Array.isArray(body.records) ? body.records : [];
          result = { data: { cases: records.map(raw => { const row = object(raw), value = object(row.value);
            return { sourcePath: row.path, folderPath: "/" + text(value.folderPath).replace(/^\/+/, ""), warnings: [], content: {
              title: text(value.title), description: text(value.description), preconditions: text(value.preconditions), testData: text(value.testData),
              type: text(value.type, "manual"), lifecycle: text(value.lifecycle, "draft"), priority: value.priority === null ? null : text(value.priority, "medium"),
              component: text(value.component), tags: value.tags ?? [], estimatedMinutes: value.estimatedMinutes ?? null, steps: value.steps ?? [], checklist: value.checklist ?? [] } }; }), issues: [] } };
        } else if (path === "/projects") result = { data: exchangeProjects, meta };
        else if (project) result = { data: project };
        else if (path.endsWith("/folders") && method === "POST") {
          const parent = folders.find(folder => folder.id === body.parentId && folder.projectId === scopeProject);
          const folder: Api["RepositoryFolder"] = { id: `folder-preview-${folders.length}`, projectId: scopeProject, workspaceId: exchangeWorkspace,
            name: text(body.name), path: `${parent?.path ?? ""}/${text(body.name)}`, parentId: parent?.id ?? null, rowVersion: 1,
            archivedAt: null, createdAt: at, updatedAt: at, etag: '"preview:1"', appearance: null };
          folders.push(folder); result = { data: folder }; log(`WRITE folder ${scopeProject} ${folder.path}`);
        } else if (path.endsWith("/folders")) result = { data: folders.filter(folder => folder.projectId === scopeProject), meta };
        else if (path.includes("/import-files") && method === "POST") {
          const id = path.split("/").pop() ?? ""; const original = originals.get(id); if (!original) throw new Error("Local original not found");
          const receipt: Api["ImportFile"] = { id, workspaceId: exchangeWorkspace, projectId: scopeProject, folderId: text(body.folderId) || null,
            destinationPath: folders.find(folder => folder.id === body.folderId)?.path ?? "/", createdBy: "preview-human", createdAt: at,
            fileName: original.file.name, byteSize: original.file.size, status: "ready" };
          if (!history.some(item => item.id === id)) { history.push(receipt); log(`WRITE source-receipt ${scopeProject}`); } result = { data: receipt };
        } else if (path.includes("/import-files/") && method === "GET") result = { data: history.find(row => row.id === path.split("/").pop() && row.projectId === scopeProject) };
        else if (path.includes("/import-files")) result = { data: history.filter(row => row.projectId === scopeProject && row.fileName.toLowerCase().includes((url.searchParams.get("q") ?? "").toLowerCase())), meta };
        else if (path === "/test-cases" && method === "POST") {
          const record = makeCase(body as Api["TestCaseCreateRequest"], cases.length + 1); cases.push(record); result = { data: record }; log(`WRITE case ${record.projectId} ${record.current.title}`);
        } else if (path === "/test-cases") {
          const projectId = url.searchParams.get("projectId"); if (!projectId) throw new Error("Local export requires one explicit project");
          result = { data: cases.filter(item => item.projectId === projectId), meta }; log(`READ export ${projectId}`);
        } else if (path.startsWith("/test-cases/")) result = { data: cases.find(item => item.id === path.split("/")[2]) };
        else if (path === "/profile/mcp-connections") result = { data: [], meta };
        else if (path === "/codex/setup") result = { data: { workspaceId: exchangeWorkspace, companyName: "Local example", status: "available",
          teamAdministrationAvailable: true, canConnect: true, readOnly: false, connectionKind: "company", installation: { pluginUrl: null }, server: {
            name: "Falcon", url: "https://example.invalid/api/v1/mcp", resource: "https://example.invalid/api/v1/mcp", issuer: "https://example.invalid/api/v1/falcon-oauth",
            connectionName: "Local example", scopes: ["falcon:read"], authentication: "oauth", version: "1" } } };
        else if (path.includes("/actors")) result = { data: [{ kind: "human", identityId: "preview-human", name: "Alex Morgan", email: null, role: "qa_manager", presence: "online" }], meta };
        else throw new Error(`Local fixture has no endpoint: ${method} ${path}`);
        if (key) receipts.set(`${path}:${key}`, result);
      }
      return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ETag: '"preview:1"' } });
    } });
  const attachments: PrivateAttachmentClient = {
    async upload(input) {
      input.signal?.throwIfAborted(); const previous = uploads.get(input.operationKey); if (previous) return originals.get(previous)!.metadata;
      const hash = await crypto.subtle.digest("SHA-256", await input.file.arrayBuffer()); input.signal?.throwIfAborted();
      const id = `original-preview-${originals.size + 1}`;
      const metadata: AttachmentMetadata = { id, projectId: input.projectId ?? null, owner: input.owner, kind: input.kind, originalFilename: input.file.name,
        mimeType: input.mimeType, trustedExtension: input.file.name.split(".").pop() ?? "", byteSize: input.file.size,
        sha256: [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join(""), status: "ready", createdAt: at, updatedAt: at };
      originals.set(id, { file: input.file, metadata, url: URL.createObjectURL(input.file) }); uploads.set(input.operationKey, id);
      log(`WRITE private-upload ${input.projectId}`); return metadata;
    },
    getMetadata(id) { const original = originals.get(id); return original ? Promise.resolve({ metadata: original.metadata, etag: '"preview:1"' }) : Promise.reject(new Error("Local original not found")); },
    createAccess(input) { const original = originals.get(input.attachmentId); return original ? Promise.resolve({ attachmentId: input.attachmentId,
      method: "GET", url: original.url, headers: {}, expiresAt: "2099-11-12T10:00:00Z" }) : Promise.reject(new Error("Local original not found")); },
    remove(input) { const original = originals.get(input.attachmentId); if (!original) return Promise.reject(new Error("Local original not found"));
      original.metadata = { ...original.metadata, status: "deleted" }; const row = history.find(item => item.id === input.attachmentId); if (row) row.status = "deleted";
      log(`WRITE delete-original ${input.attachmentId}`); return Promise.resolve({ metadata: original.metadata, etag: '"preview:2"' }); },
  };
  return { http, attachments };
}
