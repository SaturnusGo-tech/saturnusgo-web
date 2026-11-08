import assert from "node:assert/strict";
import { test } from "node:test";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { listProductDocRuns } from "../productDocRunApi";

const scope = { workspaceId: "workspace", projectId: "article-project", docId: "doc" };

test("sends native filters and searches the run catalog before applying the cursor", async () => {
  let requested = "";
  const run = { id: "run_700", projectId: "second", projectName: "Release", name: "Nightly run", key: "RUN-700",
    environmentName: "Staging", components: ["Billing"], tags: ["nightly"], createdAt: "2026-11-08T10:00:00Z", status: "completed" };
  const http = { get: async (url: string) => {
    requested = url;
    return { data: [run], meta: { hasMore: true, nextCursor: "opaque-next" } };
  } } as unknown as TmsHttpClient;
  const page = await listProductDocRuns(http, scope, {
    q: " RUN-700 ", ql: 'folder: "/Orders and Billing" AND priority: high', projects: ["second", "third"],
    folders: ["/Orders and Billing", "/Orders, Returns"], components: ["Billing"], results: ["failed"], productGroups: ["commerce"],
    products: ["returns"], regression: ["true"], types: ["manual"], priorities: ["high"], statuses: ["ready"],
    owners: ["unassigned"], tags: ["nightly"],
  }, "opaque-current", new AbortController().signal);
  const url = new URL(requested, "https://falcon.test");
  assert.equal(url.pathname, "/workspaces/workspace/projects/article-project/product-docs/doc/run-embeds/candidates");
  assert.equal(url.searchParams.get("q"), "RUN-700");
  assert.equal(url.searchParams.get("ql"), 'folder: "/Orders and Billing" AND priority: high');
  assert.equal(url.searchParams.get("cursor"), "opaque-current");
  assert.deepEqual(url.searchParams.getAll("projectIds"), ["second", "third"]);
  assert.deepEqual(url.searchParams.getAll("folders"), ["/Orders and Billing", "/Orders, Returns"]);
  assert.equal(url.searchParams.get("results"), "failed");
  assert.equal(url.searchParams.get("components"), "Billing");
  assert.equal(url.searchParams.get("productGroups"), "commerce");
  assert.equal(url.searchParams.get("products"), "returns");
  assert.equal(url.searchParams.get("regression"), "true");
  assert.equal(url.searchParams.get("types"), "manual");
  assert.equal(url.searchParams.get("priorities"), "high");
  assert.equal(url.searchParams.get("statuses"), "ready");
  assert.equal(url.searchParams.get("owners"), "unassigned");
  assert.equal(url.searchParams.get("tags"), "nightly");
  assert.deepEqual(page, { items: [run], nextCursor: "opaque-next" });
});
