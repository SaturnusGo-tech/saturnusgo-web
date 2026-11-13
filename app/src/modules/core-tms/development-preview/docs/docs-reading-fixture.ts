import type { ProductDocsApi } from "../../product-docs/domain/product-docs";
import type { ProductDocImpact } from "../../product-docs/domain/impact/product-doc-impact";
import { readingAccess, type ReadingRole } from "./fixtures/reading-access";
import { assertReadingScope, readingScope } from "./fixtures/reading-scope";
import { createReadingState } from "./fixtures/state/reading-state";
import { createReadingQuery } from "./fixtures/query/reading-query";
import { createReadingLifecycle } from "./fixtures/lifecycle/reading-lifecycle";

export function createReadingFixture(ru: boolean, role: ReadingRole = "workspace_admin", notify?: (action: string, id: string) => void) {
  const state = createReadingState(ru, role, notify), access = readingAccess(role);
  const query = createReadingQuery(state), lifecycle = createReadingLifecycle(state, query.get);
  const unavailable = async (): Promise<never> => { throw Object.assign(new Error("Unsupported local preview operation"), { status: 403, code: "PRODUCT_DOC_ACCESS_DENIED" }); };
  async function editable(scope: Parameters<ProductDocsApi["get"]>[0], id: string, expected: number) {
    await query.get(scope, id, { draft: true });
    const doc = state.docs.find(candidate => candidate.id === id)!;
    if (doc.lifecycleVersion !== expected) throw Object.assign(new Error("Local document changed"), { status: 409, code: "PRODUCT_DOC_STALE_DRAFT" });
    return doc;
  }
  const api: ProductDocsApi & Pick<typeof lifecycle, "delete"> = {
    ...query, ...lifecycle,
    postComment: unavailable, listCaseRequirements: unavailable,
    async availability(scope, signal) { assertReadingScope(scope, signal); return true; },
    async create(scope, input, options) {
      assertReadingScope(scope, options.signal);
      if (!access.canEdit) return unavailable();
      if (input.parentId) await query.get(scope, input.parentId, { draft: true });
      const id = `local-${state.docs.length + 1}`;
      state.docs.push({ id, parentId: input.parentId ?? null, kind: input.kind, title: input.title,
        draftVersion: 1, lifecycleVersion: 1, publishedVersion: null, version: null,
        sections: [], ...access });
      state.writes.push({ action: "create", id }); state.notify("create", id);
      return { id };
    },
    async save(scope, id, input) {
      const doc = await editable(scope, id, input.expectedDraftVersion);
      doc.title = input.title; doc.sections = structuredClone(input.sections);
      doc.titleHighlights = input.titleHighlights; doc.lifecycleVersion++; doc.draftVersion++;
      state.writes.push({ action: "save", id }); state.notify("save", id);
      return { draftVersion: doc.lifecycleVersion };
    },
    async publish(scope, id, input) {
      if (!access.canPublish) return unavailable();
      const doc = await editable(scope, id, input.expectedDraftVersion);
      doc.publishedVersion = (doc.publishedVersion ?? 0) + 1;
      state.publications.set(`${id}:${doc.publishedVersion}`, structuredClone({ ...doc, version: doc.publishedVersion }));
      state.writes.push({ action: "publish", id }); state.notify("publish", id);
      return { version: doc.publishedVersion };
    },
    async move(scope, id, input) {
      if (!access.canPublish) return unavailable();
      const doc = await editable(scope, id, input.expectedDraftVersion);
      if (input.parentId) {
        let parent = await query.get(scope, input.parentId, { draft: true });
        const visited = new Set<string>();
        while (parent && !visited.has(parent.id)) {
          if (parent.id === id) throw Object.assign(new Error("Local tree cycle"), { code: "PRODUCT_DOC_TREE_CYCLE", status: 409 });
          visited.add(parent.id);
          if (!parent.parentId) break;
          parent = await query.get(scope, parent.parentId, { draft: true });
        }
      }
      doc.parentId = input.parentId; doc.lifecycleVersion++; doc.draftVersion++;
      return { draftVersion: doc.lifecycleVersion };
    },
    async setAppearance(scope, id, input) {
      const doc = await editable(scope, id, input.expectedDraftVersion);
      doc.appearance = structuredClone(input.appearance); doc.lifecycleVersion++; doc.draftVersion++;
      return { draftVersion: doc.lifecycleVersion };
    },
    async getImpact(scope, id, options) {
      const doc = await query.get(scope, id, { draft: options?.draft, signal: options?.signal });
      return { cases: state.cases.map(c => ({ ...c, needsUpdate: false, affected: true, missingSection: false })), totalLinkedCases: state.cases.length,
        affectedCases: state.cases.length, casesNeedingUpdate: 0, nextCursor: null, publishedVersion: doc.publishedVersion,
        draftVersion: doc.draftVersion, changes: { pageChanged: false, orderChanged: false, sections: [] } } satisfies ProductDocImpact;
    },
    async listArticleCases(scope, id) { await query.get(scope, id); return { cases: structuredClone(state.cases), nextCursor: null }; },
    async listComments(scope, id) { await query.get(scope, id); return { comments: [], nextCursor: null, canComment: false }; },
    async listRunRequirements(scope) {
      const pinned = await query.get(scope, "calendar", { version: 1 });
      return { requirements: [{ docId: pinned.id, sectionId: "history", title: pinned.title, sectionTitle: null, version: 1 }], canEdit: false, nextCursor: null };
    },
    async linkRequirement(scope, caseId, docId) {
      await query.get(scope, docId, { draft: true });
      if (!state.cases.some(c => c.caseId === caseId)) state.cases.push({ caseId, title: caseId, sectionId: null });
      return { docId };
    },
    async unlinkRequirement(scope, caseId, docId) {
      await query.get(scope, docId, { draft: true });
      const index = state.cases.findIndex(c => c.caseId === caseId);
      if (index >= 0) state.cases.splice(index, 1); return { docId };
    },
  };
  return { api, docs: state.docs, cases: state.cases, writes: state.writes, access,
    injectConflict() { state.conflictNext = true; }, scope: readingScope };
}
