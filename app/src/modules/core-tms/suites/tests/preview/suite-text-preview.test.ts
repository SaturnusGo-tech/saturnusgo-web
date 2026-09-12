import assert from "node:assert/strict";
import test from "node:test";
import { loadSuiteTextMatches } from "../../data/preview/suite-text-preview";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";

test("saved text criteria page through the authoritative description search with an unchanged scope", async () => {
  const urls: string[] = []; const signal = new AbortController().signal;
  const http = { get: async (url: string, inputSignal: AbortSignal) => {
    assert.equal(inputSignal, signal); urls.push(url);
    return urls.length === 1 ? { data: [{ id: "a", projectId: "p" }], meta: { hasMore: true, nextCursor: "cursor-2" } } : { data: [{ id: "b", projectId: "p" }], meta: { hasMore: false, nextCursor: null } };
  } } as unknown as TmsHttpClient;
  assert.deepEqual([...await loadSuiteTextMatches(http, "p", "поиск & description", signal)], ["a", "b"]);
  const first = new URL(urls[0], "https://example.test").searchParams; const second = new URL(urls[1], "https://example.test").searchParams;
  assert.equal(first.get("projectId"), "p"); assert.equal(first.get("search"), "поиск & description"); assert.equal(first.get("limit"), "100");
  assert.equal(second.get("search"), first.get("search")); assert.equal(second.get("cursor"), "cursor-2");
});
test("incomplete or repeated cursors fail instead of presenting a partial set as complete", async () => {
  const http = { get: async () => ({ data: [], meta: { hasMore: true, nextCursor: "again" } }) } as unknown as TmsHttpClient;
  await assert.rejects(loadSuiteTextMatches(http, "p", "term", new AbortController().signal), /finish loading/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(loadSuiteTextMatches(http, "p", "term", controller.signal), { name: "AbortError" });
});
