import assert from "node:assert/strict";
import test from "node:test";
import { DefectBrowserAccessError } from "../model/defect-browser-error";
import { DefectBrowserController } from "../application/DefectBrowserController";
import type { DefectBrowserSource, DefectGroupPage } from "../model/defect-browser";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
const item = (id: string, component = "Auth") => ({ id, component } as Defect);
const groupPage = (component = "Auth", cursor: string | null = null): DefectGroupPage => ({
  groups: [{ component, total: 1200, open: 1190, critical: 40 }],
  totals: { total: 1200, open: 1190, critical: 40 }, groupCount: 1, nextCursor: cursor,
});
function harness() {
  type Page = DefectGroupPage | { items: Defect[]; nextCursor: string | null };
  const requests: { kind: string; component?: string; cursor: string | null; signal: AbortSignal;
    resolve: (page: Page) => void; reject: (reason?: unknown) => void }[] = [];
  const enqueue = <T extends Page>(kind: string, cursor: string | null, signal: AbortSignal, component?: string) =>
    new Promise<T>((resolve, reject) => { requests.push({ kind, component, cursor, signal,
      resolve: (page) => resolve(page as T), reject }); });
  const source: DefectBrowserSource = {
    groups: (_query, cursor, signal) => enqueue("groups", cursor, signal),
    records: (_query, component, cursor, signal) => enqueue("records", cursor, signal, component),
  };
  return { requests, controller: new DefectBrowserController(source) };
}

test("search and scope changes cancel all old branch requests without restoring stale content", async () => {
  const { requests, controller } = harness();
  controller.configure("project-a", { projectId: "a", q: "" });
  requests[0].resolve(groupPage()); await tick();
  controller.openComponent("Auth"); controller.openComponent("Payments");
  controller.configure("project-b", { projectId: "b", q: "new search" });
  assert.equal(requests[1].signal.aborted, true); assert.equal(requests[2].signal.aborted, true);
  requests[3].resolve(groupPage("New")); requests[1].resolve({ items: [item("stale")], nextCursor: null });
  await tick();
  assert.deepEqual(Object.keys(controller.getState().branches), []);
  assert.equal(controller.getState().groups[0].component, "New");
});

test("branches load independently, deduplicate continuation and preserve authoritative full counts", async () => {
  const { requests, controller } = harness();
  controller.configure("scope", { projectId: "a", q: "" });
  requests[0].resolve(groupPage()); await tick();
  controller.openComponent(""); controller.openComponent("__proto__"); controller.openComponent("");
  assert.equal(requests.length, 3);
  requests[1].resolve({ items: [item("a", "")], nextCursor: "more" });
  requests[2].resolve({ items: [item("b", "__proto__")], nextCursor: null }); await tick();
  controller.loadMoreComponent("");
  assert.equal(requests[3].cursor, "more");
  requests[3].resolve({ items: [item("a", ""), item("c", "")], nextCursor: null }); await tick();
  assert.deepEqual(controller.getState().branches[""].items.map((record) => record.id), ["a", "c"]);
  assert.equal(controller.getState().branches["__proto__"].items[0].id, "b");
  assert.equal(controller.getState().totals?.total, 1200);
});

test("mutation refresh supersedes in-flight reads while retaining branches; failures remain retryable", async () => {
  const { requests, controller } = harness();
  controller.configure("scope", { projectId: "a", q: "" }); requests[0].resolve(groupPage()); await tick();
  controller.openComponent("Auth"); controller.refresh();
  assert.equal(requests[1].signal.aborted, true);
  requests[1].resolve({ items: [item("old")], nextCursor: null });
  requests[2].resolve(groupPage()); requests[3].resolve({ items: [item("new")], nextCursor: "next" }); await tick();
  controller.loadMoreComponent("Auth"); requests[4].reject(new Error("Unavailable")); await tick();
  assert.equal(controller.getState().branches.Auth.status, "error");
  assert.equal(controller.getState().branches.Auth.items[0].id, "new");
  controller.retryComponent("Auth"); requests[5].resolve({ items: [item("recovered")], nextCursor: null }); await tick();
  assert.equal(controller.getState().branches.Auth.items[0].id, "recovered");
});

test("a repeated group cursor fails visibly and cannot create an infinite pagination loop", async () => {
  const { requests, controller } = harness();
  controller.configure("scope", { projectId: "a", q: "" }); requests[0].resolve(groupPage("Auth", "cursor")); await tick();
  controller.loadMoreGroups(); requests[1].resolve(groupPage("Auth", "cursor")); await tick();
  assert.equal(controller.getState().groupsStatus, "error");
  assert.equal(controller.getState().groups.length, 1);
  controller.reset(); assert.equal(controller.getState().groups.length, 0);
});

test("background refresh revalidates the loaded extent instead of collapsing back to one page", async () => {
  const { requests, controller } = harness();
  controller.configure("scope", { projectId: "a", q: "" }); requests[0].resolve(groupPage("Auth", "group-next")); await tick();
  controller.loadMoreGroups(); requests[1].resolve(groupPage("Payments")); await tick();
  controller.openComponent("Auth"); requests[2].resolve({ items: [item("1")], nextCursor: "items-next" }); await tick();
  controller.loadMoreComponent("Auth"); requests[3].resolve({ items: [item("2")], nextCursor: "items-last" }); await tick();
  controller.refresh(); requests[4].resolve(groupPage("Auth", "group-next"));
  requests[5].resolve({ items: [item("1")], nextCursor: "items-next" }); await tick();
  assert.equal(requests[6].cursor, "group-next"); assert.equal(requests[7].cursor, "items-next");
  requests[6].resolve(groupPage("Payments")); requests[7].resolve({ items: [item("2")], nextCursor: "items-last" }); await tick();
  assert.equal(controller.getState().groups.length, 2);
  assert.equal(controller.getState().branches.Auth.items.length, 2);
  assert.equal(controller.getState().branches.Auth.hasMore, true);
});

test("revoked access clears cached totals and records and cancels sibling requests", async () => {
  const { requests, controller } = harness();
  controller.configure("scope", { projectId: "a", q: "" }); requests[0].resolve(groupPage()); await tick();
  controller.openComponent("Auth"); controller.openComponent("Payments");
  requests[1].reject(new DefectBrowserAccessError()); await tick();
  assert.equal(requests[2].signal.aborted, true);
  requests[2].resolve({ items: [item("hidden")], nextCursor: null }); await tick();
  assert.equal(controller.getState().totals, null);
  assert.equal(controller.getState().groupsStatus, "error");
  assert.deepEqual(Object.keys(controller.getState().branches), []);
});
