import type { ProductDocsApi } from "../../../../product-docs/domain/product-docs";
import { readingAccess } from "../reading-access";
import { assertReadingScope } from "../reading-scope";
import type { ReadingDoc, ReadingState } from "../state/reading-state";

function fail(code: string, status = 409): never {
  throw Object.assign(new Error(code), { code, status, requestId: "local-doc-preview" });
}
function branch(state: ReadingState, id: string): ReadingDoc[] {
  const ids = new Set([id]);
  for (let changed = true; changed;) {
    changed = false;
    for (const doc of state.docs) if (doc.parentId && ids.has(doc.parentId) && !ids.has(doc.id)) { ids.add(doc.id); changed = true; }
  }
  return state.docs.filter(doc => ids.has(doc.id));
}
const settle = () => new Promise<void>(resolve => setTimeout(resolve, 180));

export function createReadingLifecycle(state: ReadingState, get: ProductDocsApi["get"]) {
  const access = readingAccess(state.role);
  function current(id: string, expected: number) {
    const doc = state.docs.find(candidate => candidate.id === id && !candidate.deletedAt);
    if (!doc) fail("PRODUCT_DOC_NOT_FOUND", 404);
    if (state.conflictNext) { state.conflictNext = false; doc.lifecycleVersion++; doc.draftVersion++; }
    if (doc.lifecycleVersion !== expected) fail("PRODUCT_DOC_STALE_DRAFT");
    return doc;
  }
  const setArchived: ProductDocsApi["setArchived"] = async (scope, id, archived, input) => {
    assertReadingScope(scope);
    if (!archived && !access.canPublish) fail("PRODUCT_DOC_ACCESS_DENIED", 403);
    const candidate = state.docs.find(doc => doc.id === id);
    if (!candidate) fail("PRODUCT_DOC_NOT_FOUND", 404);
    await get(scope, id, { archived: !archived, draft: archived && access.canEdit && candidate.publishedVersion === null });
    const doc = current(id, input.expectedDraftVersion);
    if (!archived) {
      const parent = state.docs.find(candidate => candidate.id === doc.parentId);
      if (parent?.deletedAt) fail("PRODUCT_DOC_NOT_FOUND", 404);
      if (parent?.archivedAt) fail("PRODUCT_DOC_PARENT_ARCHIVED");
      if (parent?.kind === "page" && parent.publishedVersion === null && branch(state, id).some(item => item.publishedVersion !== null)) {
        fail("PRODUCT_DOC_PARENT_UNPUBLISHED");
      }
    }
    await settle(); current(id, input.expectedDraftVersion);
    const at = new Date().toISOString(), affected = archived
      ? branch(state, id).filter(item => !item.archivedAt && !item.deletedAt)
      : state.docs.filter(item => state.archiveRoots.get(item.id) === id && !item.deletedAt);
    for (const item of affected) {
      item.archivedAt = archived ? at : null;
      if (archived) state.archiveRoots.set(item.id, id); else state.archiveRoots.delete(item.id);
      item.lifecycleVersion++; item.draftVersion++;
    }
    state.writes.push({ action: archived ? "archive" : "restore", id });
    state.notify(archived ? "archive" : "restore", id);
    return { draftVersion: doc.lifecycleVersion, archivedAt: archived ? at : null, affectedCount: affected.length };
  };
  const remove = async (scope: Parameters<ProductDocsApi["get"]>[0], id: string,
    input: { expectedDraftVersion: number }, options: { idempotencyKey: string }) => {
    assertReadingScope(scope);
    if (!access.canDelete) fail("PRODUCT_DOC_ACCESS_DENIED", 403);
    if (!options.idempotencyKey) fail("IDEMPOTENCY_KEY_REQUIRED", 400);
    const key = `${id}:${options.idempotencyKey}`, fingerprint = JSON.stringify(input);
    const existing = state.deleteReceipts.get(key);
    if (existing) {
      if (existing.fingerprint !== fingerprint) fail("IDEMPOTENCY_KEY_REUSED");
      return structuredClone(existing.result);
    }
    const doc = current(id, input.expectedDraftVersion);
    await settle();
    const replay = state.deleteReceipts.get(key);
    if (replay) {
      if (replay.fingerprint !== fingerprint) fail("IDEMPOTENCY_KEY_REUSED");
      return structuredClone(replay.result);
    }
    current(id, input.expectedDraftVersion);
    const deletedAt = new Date().toISOString(), affected = branch(state, id).filter(item => !item.deletedAt);
    for (const item of affected) {
      item.deletedAt = deletedAt; item.archivedAt ??= deletedAt;
      if (!state.archiveRoots.has(item.id)) state.archiveRoots.set(item.id, id);
      item.lifecycleVersion++; item.draftVersion++;
    }
    const result = { draftVersion: doc.lifecycleVersion, deletedAt, affectedCount: affected.length };
    state.deleteReceipts.set(key, { fingerprint, result }); state.writes.push({ action: "delete", id });
    state.notify("delete", id);
    return structuredClone(result);
  };
  return { setArchived, delete: remove };
}
