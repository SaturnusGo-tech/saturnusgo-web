import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../portfolios/tests/support/component-harness";
import { isMissingProductDoc } from "../../domain/errors/product-doc-response";
import type { ProductDocDetail, ProductDocsApi } from "../../domain/product-docs";
import type { useProductDocResource } from "../useProductDocResource";
import type { useProductDocSelection } from "../useProductDocSelection";

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test("keeps the mounted article only while refreshing the same scope, revision and access", async (context) => {
  const harness = componentHarness();
  context.after(harness.dispose);
  const resource = harness.load<{ useProductDocResource: typeof useProductDocResource }>(
    new URL("../useProductDocResource.ts", import.meta.url),
  );
  const { useProductDocSelection: select } = harness.load<{ useProductDocSelection: typeof useProductDocSelection }>(
    new URL("../useProductDocSelection.ts", import.meta.url),
    (module) => module.endsWith("useProductDocResource") ? resource
      : module.endsWith("product-doc-response") ? { isMissingProductDoc } : undefined,
  );
  const requests: Array<{
    signal: AbortSignal;
    resolve(data: ProductDocDetail): void;
    reject(error: unknown): void;
  }> = [];
  const api = {
    get: (_scope, _id, options) => new Promise<ProductDocDetail>((resolve, reject) => {
      assert.ok(options?.signal);
      requests.push({ signal: options.signal, resolve, reject });
    }),
  } satisfies Pick<ProductDocsApi, "get"> as ProductDocsApi;
  const scope = { workspaceId: "workspace", projectId: "project" };
  const detail: ProductDocDetail = {
    id: "doc", kind: "page", parentId: null, title: "Run notes", draftVersion: 1, publishedVersion: 1,
    sections: [], version: 1, canEdit: true, canPublish: true,
  };
  const read = (refresh: number, version?: number, allowDraft = true, projectId = scope.projectId) =>
    harness.render(() => select(api, { ...scope, projectId }, { docId: detail.id, version }, false, refresh, allowDraft));

  assert.equal(read(0).status, "loading");
  requests[0].resolve(detail);
  await flush();

  const refreshing = read(1);
  assert.equal(refreshing.status, "ready");
  if (refreshing.status === "ready") assert.equal(refreshing.data, detail);
  assert.equal(read(2).status, "ready");
  assert.equal(requests[1].signal.aborted, true);
  requests[1].resolve({ ...detail, title: "Stale response" });
  await flush();
  const stillRefreshing = read(2);
  assert.equal(stillRefreshing.status, "ready");
  if (stillRefreshing.status === "ready") assert.equal(stillRefreshing.data, detail);

  const error = new Error("Access revoked");
  requests[2].reject(error);
  await flush();
  const denied = read(2);
  assert.equal(denied.status, "error");
  if (denied.status === "error") assert.equal(denied.error, error);

  assert.equal(read(3).status, "loading");
  requests[3].resolve(detail);
  await flush();
  assert.equal(read(3).status, "ready");
  assert.equal(read(3, 1).status, "loading");
  assert.equal(read(3, undefined, false).status, "loading");
  assert.equal(read(3, undefined, true, "other-project").status, "loading");
});
