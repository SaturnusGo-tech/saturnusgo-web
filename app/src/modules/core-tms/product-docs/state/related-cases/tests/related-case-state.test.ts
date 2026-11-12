import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";
import { loadRelatedCases } from "../../../data/related-cases/load-related-cases";
import { saveRelatedCases } from "../../../requirements/related-cases/save-related-cases";
import { notifyCaseRequirementsChanged, subscribeCaseRequirementsChanged } from "../../../requirements/save/case-requirements-events";
import type { ProductDocsApi } from "../../../domain/product-docs";
import type { useProductDocResource } from "../../useProductDocResource";
import type { useProductDocRelatedCases } from "../useProductDocRelatedCases";

const flush = () => new Promise<void>(resolve => setImmediate(resolve));
const scope = { workspaceId: "w", projectId: "p" };
test("server state follows saved draft versions and scoped source invalidations", async t => {
  const h = componentHarness(); t.after(h.dispose);
  const resource = h.load<{ useProductDocResource: typeof useProductDocResource }>(new URL("../../useProductDocResource.ts", import.meta.url));
  const { useProductDocRelatedCases: useCases } = h.load<{ useProductDocRelatedCases: typeof useProductDocRelatedCases }>(
    new URL("../useProductDocRelatedCases.ts", import.meta.url), name => name.endsWith("useProductDocResource") ? resource
      : name.endsWith("load-related-cases") ? { loadRelatedCases } : name.endsWith("save-related-cases") ? { saveRelatedCases }
        : name.endsWith("case-requirements-events") ? { subscribeCaseRequirementsChanged } : undefined);
  const rows = new Set(["a"]), versions: Array<number | undefined> = [];
  const api = {
    async getImpact(_scope, _id, options) {
      versions.push(options?.expectedDraftVersion);
      return { cases: [...rows].map(caseId => ({ caseId, title: caseId, sectionId: null, needsUpdate: false, affected: false, missingSection: false })),
        nextCursor: null, totalLinkedCases: rows.size, affectedCases: 0, casesNeedingUpdate: 0, draftVersion: 3, publishedVersion: 2, changes: null };
    },
    async linkRequirement(_scope, caseId, docId) { rows.add(caseId); return { docId }; },
    async unlinkRequirement(_scope, caseId, docId) { rows.delete(caseId); return { docId }; },
  } satisfies Pick<ProductDocsApi, "getImpact" | "linkRequirement" | "unlinkRequirement"> as unknown as ProductDocsApi;
  const read = (version = 3) => h.render(() => useCases(api, scope, "doc", version));
  read(); await flush(); assert.equal(read().status, "ready");
  notifyCaseRequirementsChanged({ ...scope, projectId: "other" }, "a"); read();
  assert.equal(versions.length, 1);
  rows.add("b"); notifyCaseRequirementsChanged(scope, "b");
  assert.equal(read().status, "ready", "revalidation keeps existing case links visible"); await flush();
  const changed = read(); assert.equal(changed.status, "ready");
  if (changed.status === "ready") assert.equal(changed.data.length, 2);
  assert.equal(read(4).status, "ready", "saving text keeps independent case links visible"); await flush(); assert.equal(read(4).status, "ready");
  assert.deepEqual(versions, [3, 3, 4]);
});

test("a partial bulk-save failure reconciles committed links and keeps the save error", async t => {
  const h = componentHarness(); t.after(h.dispose);
  const resource = h.load<{ useProductDocResource: typeof useProductDocResource }>(new URL("../../useProductDocResource.ts", import.meta.url));
  const { useProductDocRelatedCases: useCases } = h.load<{ useProductDocRelatedCases: typeof useProductDocRelatedCases }>(
    new URL("../useProductDocRelatedCases.ts", import.meta.url), name => name.endsWith("useProductDocResource") ? resource
      : name.endsWith("load-related-cases") ? { loadRelatedCases } : name.endsWith("save-related-cases") ? { saveRelatedCases }
        : name.endsWith("case-requirements-events") ? { subscribeCaseRequirementsChanged } : undefined);
  const persisted = new Set(["a"]), writes: string[] = [];
  let reads = 0;
  const api = {
    async getImpact() {
      reads++;
      return { cases: [...persisted].map(caseId => ({ caseId, title: caseId, sectionId: null, needsUpdate: false, affected: false, missingSection: false })),
        nextCursor: null, totalLinkedCases: persisted.size, affectedCases: 0, casesNeedingUpdate: 0, draftVersion: 3, publishedVersion: 2, changes: null };
    },
    async linkRequirement(_scope, caseId, docId) {
      writes.push(caseId);
      if (caseId === "c") throw new Error("Link could not be saved");
      persisted.add(caseId);
      return { docId };
    },
    async unlinkRequirement() { assert.fail("partial failure must not roll back committed links"); },
  } satisfies Pick<ProductDocsApi, "getImpact" | "linkRequirement" | "unlinkRequirement"> as unknown as ProductDocsApi;
  const read = () => h.render(() => useCases(api, scope, "doc", 3));
  read(); await flush();
  const initial = read(); assert.equal(initial.status, "ready");
  const cases = ["a", "b", "c"].map(caseId => ({ caseId, title: caseId, sectionId: null }));
  assert.equal(await initial.save({ baseline: initial.status === "ready" ? initial.data : [], cases }), false);
  read(); await flush();
  const reconciled = read();
  assert.equal(reconciled.status, "ready");
  if (reconciled.status === "ready") assert.deepEqual(reconciled.data.map(item => item.caseId), ["a", "b"]);
  assert.deepEqual([...persisted], ["a", "b"]);
  assert.deepEqual(writes, ["b", "c"]);
  assert.equal(reads, 2, "the failed operation must reload authoritative links after suppressed self-events");
  assert.equal(reconciled.saveFailed, true, "reconciliation must preserve the original save-error toast");
  assert.equal(read().busy, false);
});


test("a late reconciliation cannot change a new document or accept stale and unmounted saves", async t => {
  const h = componentHarness(); t.after(h.dispose);
  const resource = h.load<{ useProductDocResource: typeof useProductDocResource }>(new URL("../../useProductDocResource.ts", import.meta.url));
  const { useProductDocRelatedCases: useCases } = h.load<{ useProductDocRelatedCases: typeof useProductDocRelatedCases }>(
    new URL("../useProductDocRelatedCases.ts", import.meta.url), name => name.endsWith("useProductDocResource") ? resource
      : name.endsWith("load-related-cases") ? { loadRelatedCases } : name.endsWith("save-related-cases") ? { saveRelatedCases }
        : name.endsWith("case-requirements-events") ? { subscribeCaseRequirementsChanged } : undefined);
  let firstReads = 0, release!: () => void, writes = 0;
  const api = {
    async getImpact(_scope, docId) {
      if (docId === "first" && ++firstReads > 1) await new Promise<void>(resolve => { release = resolve; });
      return { cases: [{ caseId: docId, title: docId, sectionId: null, needsUpdate: false, affected: false, missingSection: false }],
        nextCursor: null, totalLinkedCases: 1, affectedCases: 0, casesNeedingUpdate: 0, draftVersion: 3, publishedVersion: 2, changes: null };
    },
    async linkRequirement() { writes++; throw new Error("Save failed"); },
    async unlinkRequirement() { assert.fail("no removal was requested"); },
  } satisfies Pick<ProductDocsApi, "getImpact" | "linkRequirement" | "unlinkRequirement"> as unknown as ProductDocsApi;
  const read = (id: string) => h.render(() => useCases(api, scope, id, 3));
  read("first"); await flush(); const first = read("first");
  assert.equal(await first.save({ baseline: [], cases: [{ caseId: "new", title: "New", sectionId: null }] }), false);
  assert.equal(read("first").busy, true);
  read("second"); await flush();
  const second = read("second");
  assert.equal(second.status, "ready");
  assert.equal(second.busy, false); assert.equal(second.saveFailed, false);
  release(); await flush();
  const current = read("second");
  if (current.status === "ready") assert.deepEqual(current.data.map(item => item.caseId), ["second"]);
  assert.equal(await first.save({ baseline: [], cases: [{ caseId: "stale", title: "Stale", sectionId: null }] }), false);
  h.dispose();
  assert.equal(await second.save({ baseline: [], cases: [{ caseId: "gone", title: "Gone", sectionId: null }] }), false);
  assert.equal(writes, 1);
});

test("a save finishing after navigation cannot report success to the new document picker", async t => {
  const h = componentHarness(); t.after(h.dispose);
  const resource = h.load<{ useProductDocResource: typeof useProductDocResource }>(new URL("../../useProductDocResource.ts", import.meta.url));
  const { useProductDocRelatedCases: useCases } = h.load<{ useProductDocRelatedCases: typeof useProductDocRelatedCases }>(
    new URL("../useProductDocRelatedCases.ts", import.meta.url), name => name.endsWith("useProductDocResource") ? resource
      : name.endsWith("load-related-cases") ? { loadRelatedCases } : name.endsWith("save-related-cases") ? { saveRelatedCases }
        : name.endsWith("case-requirements-events") ? { subscribeCaseRequirementsChanged } : undefined);
  let release!: () => void;
  const api = {
    async getImpact() {
      return { cases: [], nextCursor: null, totalLinkedCases: 0, affectedCases: 0, casesNeedingUpdate: 0, draftVersion: 3, publishedVersion: 2, changes: null };
    },
    async linkRequirement(_scope, _caseId, docId) { await new Promise<void>(resolve => { release = resolve; }); return { docId }; },
    async unlinkRequirement() { assert.fail("no removal was requested"); },
  } satisfies Pick<ProductDocsApi, "getImpact" | "linkRequirement" | "unlinkRequirement"> as unknown as ProductDocsApi;
  const read = (id: string) => h.render(() => useCases(api, scope, id, 3));
  read("first"); await flush();
  const pending = read("first").save({ baseline: [], cases: [{ caseId: "new", title: "New", sectionId: null }] });
  read("second"); await flush();
  release();
  assert.equal(await pending, false, "the previous picker must not close a newly selected target on completion");
  await flush();
  assert.equal(read("second").busy, false);
  assert.equal(read("second").saveFailed, false);
});
