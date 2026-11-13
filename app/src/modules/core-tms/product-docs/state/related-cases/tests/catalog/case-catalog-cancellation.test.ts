import assert from "node:assert/strict";
import test from "node:test";
import type { TmsHttpClient } from "../../../../../../../core/tms/transport/http";
import { listFolders } from "../../../../../folders/data/folder-api";
import { listTestCases } from "../../../../../test-cases/data/test-case-api";
import { componentHarness } from "../../../../../portfolios/tests/support/component-harness";
import type { useProductDocResource } from "../../../useProductDocResource";
import type { useProductDocCaseCatalog } from "../../useProductDocCaseCatalog";

const flush = () => new Promise<void>(resolve => setImmediate(resolve));

test("changing the picker scope and closing it cancel requests and ignore late catalog responses", async t => {
  const h = componentHarness(); t.after(h.dispose);
  const requests: Array<{ path: string; signal: AbortSignal; resolve(value: unknown): void; reject(error: unknown): void }> = [];
  const http = { get<T>(path: string, signal?: AbortSignal) {
    assert.ok(signal);
    return new Promise<T>((resolve, reject) => requests.push({ path, signal,
      resolve: value => resolve(value as T), reject }));
  } } satisfies Pick<TmsHttpClient, "get">;
  const resource = h.load<{ useProductDocResource: typeof useProductDocResource }>(new URL("../../../useProductDocResource.ts", import.meta.url));
  const { useProductDocCaseCatalog: catalog } = h.load<{ useProductDocCaseCatalog: typeof useProductDocCaseCatalog }>(
    new URL("../../useProductDocCaseCatalog.ts", import.meta.url), name =>
      name.endsWith("useTmsHttpClient") || name.endsWith("TmsHttpClientContext") ? { useTmsHttpClient: () => http }
        : name.endsWith("folder-api") ? { listFolders }
          : name.endsWith("test-case-api") ? { listTestCases }
            : name.endsWith("useProductDocResource") ? resource : undefined);
  const read = (projectId: string) => h.render(() => catalog({ workspaceId: "workspace", projectId }));
  assert.equal(read("old").status, "loading");
  assert.equal(read("current").status, "loading");
  assert.equal(requests.length, 4);
  assert.equal(requests[0].signal.aborted, true);
  assert.equal(requests[1].signal.aborted, true);
  assert.match(requests[2].path, /^\/workspaces\/workspace\/projects\/current\/folders\?/);
  assert.equal(new URL(requests[3].path, "https://tms.example").searchParams.get("projectId"), "current");
  const page = { data: [], meta: { limit: 100, hasMore: false, nextCursor: null } };
  requests[2].resolve(page); requests[3].resolve(page);
  await flush();
  assert.equal(read("current").status, "ready");
  requests[0].resolve(page); requests[1].reject(new Error("Late request failed"));
  await flush();
  assert.equal(read("current").status, "ready", "the canceled scope cannot replace the current catalog with an error");
  assert.equal(read("closing").status, "loading");
  h.dispose();
  assert.equal(requests[4].signal.aborted, true);
  assert.equal(requests[5].signal.aborted, true);
  requests[4].resolve(page); requests[5].resolve(page);
  await flush();
});

test("the scoped catalog retains archived identities for the repository Include archived filter", async t => {
  const h = componentHarness(); t.after(h.dispose);
  const http = {};
  const folders = [{ id: "old-folder", archivedAt: "2026-01-01" }, { id: "folder", archivedAt: null }];
  const cases = [{ id: "old-case", projectId: "p", archivedAt: "2026-01-01" }, { id: "case", projectId: "p", archivedAt: null }];
  const resource = h.load<{ useProductDocResource: typeof useProductDocResource }>(new URL("../../../useProductDocResource.ts", import.meta.url));
  const { useProductDocCaseCatalog: catalog } = h.load<{ useProductDocCaseCatalog: typeof useProductDocCaseCatalog }>(
    new URL("../../useProductDocCaseCatalog.ts", import.meta.url), name =>
      name.endsWith("TmsHttpClientContext") ? { useTmsHttpClient: () => http }
        : name.endsWith("folder-api") ? { listFolders: async () => folders }
          : name.endsWith("test-case-api") ? { listTestCases: async () => ({ items: cases }) }
            : name.endsWith("useProductDocResource") ? resource : undefined);
  const read = () => h.render(() => catalog({ workspaceId: "w", projectId: "p" }));
  read(); await flush();
  const ready = read(); assert.equal(ready.status, "ready");
  if (ready.status !== "ready") assert.fail("Expected the project catalog");
  assert.equal(ready.data.cases.length, 2);
  assert.equal(ready.data.folders.length, 2);
});
