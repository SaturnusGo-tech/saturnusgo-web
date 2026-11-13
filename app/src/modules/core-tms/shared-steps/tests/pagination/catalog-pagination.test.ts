import assert from "node:assert/strict";
import test from "node:test";
import { listSharedSteps } from "../../data/shared-step-api";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";

test("shared-step catalog follows bounded pages so entries beyond the first 100 remain selectable", async () => {
  const calls: string[] = [];
  const http = { async get(path: string) {
    calls.push(path);
    return calls.length === 1 ? { data: [{ id: "first" }], meta: { limit: 100, hasMore: true, nextCursor: "page+2" } }
      : { data: [{ id: "last" }], meta: { limit: 100, hasMore: false, nextCursor: null } };
  } } as unknown as TmsHttpClient;
  assert.deepEqual((await listSharedSteps(http, "project")).map(item => item.id), ["first", "last"]);
  assert.equal(calls[1], "/projects/project/shared-steps?limit=100&cursor=page%2B2");
});
test("aborted catalog loading stops before requesting another page", async () => {
  const controller = new AbortController(); let count = 0;
  const http = { async get() { count++; controller.abort(); return { data: [], meta: { hasMore: true, nextCursor: "next" } }; } } as unknown as TmsHttpClient;
  await assert.rejects(listSharedSteps(http, "project", controller.signal), { name: "AbortError" });
  assert.equal(count, 1);
});
