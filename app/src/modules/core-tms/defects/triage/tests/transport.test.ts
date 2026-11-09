import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { createDefectTriageSource } from "../defect-triage-source";

test("triage reads its own project queue and follows the API pagination envelope", async () => {
  const source = createDefectTriageSource(createTmsHttpClient({
    apiBase: "https://example.com/api/v1", credentials: "include", production: false,
    fetch: async (url) => {
      const request = new URL(String(url));
      assert.equal(request.pathname, "/api/v1/defects/triage");
      assert.deepEqual(Object.fromEntries(request.searchParams), {
        workspaceId: "ws", projectId: "p", view: "snoozed", cursor: "next+", limit: "20",
      });
      return Response.json({ data: [{ id: "defect", projectId: "p" }],
        meta: { nextCursor: "third", hasMore: true, limit: 20 } });
    },
  }));
  const page = await source.read({ workspaceId: "ws", projectId: "p" }, "snoozed", "next+");
  assert.equal(page.rows[0]?.id, "defect");
  assert.equal(page.nextCursor, "third");
});

test("duplicate decision is versioned and retries can reuse the same idempotency key", async () => {
  let calls = 0;
  const source = createDefectTriageSource(createTmsHttpClient({
    apiBase: "https://example.com/api/v1", credentials: "include", production: false,
    fetch: async (url, request) => {
      calls++;
      assert.equal(new URL(String(url)).pathname, "/api/v1/defects/source%2F1/triage");
      assert.equal(request?.method, "POST");
      assert.equal(new Headers(request?.headers).get("idempotency-key"), "triage-request");
      assert.deepEqual(JSON.parse(String(request?.body)), {
        workspaceId: "ws", projectId: "p", expectedVersion: 7, action: "duplicate", duplicateOfDefectId: "canonical", reason: "",
      });
      return Response.json({ data: { id: "source/1", projectId: "p" } });
    },
  }));
  const scope = { workspaceId: "ws", projectId: "p" };
  const decision = { action: "duplicate", duplicateOfDefectId: "canonical" } as const;
  for (let attempt = 0; attempt < 2; attempt++) {
    await source.decide(scope, "source/1", 7, decision, "triage-request");
  }
  assert.equal(calls, 2);
});

test("duplicate search excludes the source, cross-project records, and existing duplicates", async () => {
  const source = createDefectTriageSource(createTmsHttpClient({
    apiBase: "https://example.com/api/v1", credentials: "include", production: false,
    fetch: async (url) => {
      const request = new URL(String(url));
      assert.equal(request.pathname, "/api/v1/defects");
      assert.deepEqual(Object.fromEntries(request.searchParams), { projectId: "p", q: "QA-3", limit: "20" });
      const row = { projectId: "p", key: "QA-3", title: "Original defect" };
      return Response.json({ data: [
        { ...row, id: "source" },
        { ...row, id: "duplicate", triageDuplicateOfDefectId: "canonical" },
        { ...row, id: "outside", projectId: "other" },
        { ...row, id: "canonical", status: "closed" },
      ], meta: { hasMore: true, nextCursor: "next", limit: 20 } });
    },
  }));
  const candidates = await source.candidates("p", "QA-3", "source", new AbortController().signal);
  assert.deepEqual(candidates, { hasMore: true, rows: [{ id: "canonical", key: "QA-3", title: "Original defect" }] });
});
