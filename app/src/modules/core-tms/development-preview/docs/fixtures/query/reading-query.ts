import type { ProductDocNode, ProductDocsApi } from "../../../../product-docs/domain/product-docs";
import { readingAccess } from "../reading-access";
import { assertReadingScope } from "../reading-scope";
import type { ReadingDoc, ReadingState } from "../state/reading-state";

function fail(status = 404, code = "PRODUCT_DOC_NOT_FOUND"): never {
  throw Object.assign(new Error(code), { status, code, requestId: "local-doc-preview" });
}

export function createReadingQuery(state: ReadingState) {
  const access = readingAccess(state.role);
  function hiddenByDraft(doc: ReadingDoc): boolean {
    const visited = new Set<string>();
    let current: ReadingDoc | undefined = doc;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      if (current.kind === "page" && current.publishedVersion === null) return true;
      current = state.docs.find(candidate => candidate.id === current!.parentId);
    }
    return false;
  }
  const get: ProductDocsApi["get"] = async (scope, id, options) => {
    assertReadingScope(scope, options?.signal);
    if (options?.draft && options.archived) fail(400, "VALIDATION_ERROR");
    const doc = state.docs.find(candidate => candidate.id === id);
    if (!doc) fail();
    if (options?.archived && !access.canPublish) fail(403, "PRODUCT_DOC_ACCESS_DENIED");
    if (options?.version !== undefined) {
      const snapshot = state.publications.get(`${id}:${options.version}`);
      if (!snapshot) fail();
      return structuredClone({ ...snapshot, parentId: doc.parentId, archivedAt: doc.archivedAt, deletedAt: doc.deletedAt,
        lifecycleVersion: doc.lifecycleVersion, canEdit: false, canPublish: false, canArchive: false, canDelete: false });
    }
    if (doc.deletedAt || Boolean(doc.archivedAt) !== Boolean(options?.archived)) fail();
    const draft = options?.draft || options?.archived;
    if (draft && !access.canEdit) fail(403, "PRODUCT_DOC_ACCESS_DENIED");
    if (!draft && hiddenByDraft(doc)) fail();
    const snapshot = !draft && doc.kind === "page" ? state.publications.get(`${id}:${doc.publishedVersion}`) : doc;
    if (!snapshot) fail();
    return structuredClone({ ...snapshot, parentId: doc.parentId, archivedAt: doc.archivedAt,
      version: draft ? null : snapshot.version, lifecycleVersion: doc.lifecycleVersion,
      canEdit: access.canEdit && !doc.archivedAt, canPublish: access.canPublish,
      canArchive: !doc.archivedAt, canDelete: access.canDelete });
  };
  const list: ProductDocsApi["list"] = async (scope, options) => {
    assertReadingScope(scope, options?.signal);
    if ((options?.archived && !access.canPublish) || (options?.draft && !access.canEdit)) fail(403, "PRODUCT_DOC_ACCESS_DENIED");
    const candidates = state.docs.filter(doc => !doc.deletedAt && (options?.archived
      ? Boolean(doc.archivedAt) && state.archiveRoots.get(doc.id) === doc.id : !doc.archivedAt));
    const nodes: ProductDocNode[] = [];
    for (const doc of candidates) {
      if (!options?.q && !options?.archived && doc.parentId !== (options?.parentId ?? null)) continue;
      if (!options?.draft && !options?.archived && hiddenByDraft(doc)) continue;
      const projected = await get(scope, doc.id, { draft: options?.draft, archived: options?.archived });
      if (options?.q && !projected.title.toLowerCase().includes(options.q.toLowerCase())) continue;
      nodes.push({ id: doc.id, parentId: doc.parentId, kind: doc.kind, title: projected.title,
        draftVersion: projected.draftVersion, lifecycleVersion: doc.lifecycleVersion,
        publishedVersion: doc.publishedVersion, archivedAt: doc.archivedAt, appearance: doc.appearance,
        taxonomy: projected.taxonomy });
    }
    const rows = nodes.sort((left, right) => left.id.localeCompare(right.id)).filter(doc => !options?.cursor || doc.id > options.cursor);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 100)), page = rows.slice(0, limit);
    return { nodes: page, nextCursor: rows.length > limit ? page[page.length - 1].id : null, ...access };
  };
  return { get, list };
}
