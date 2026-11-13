import assert from "node:assert/strict";
import test from "node:test";
import { readingPreviewFetch } from "../../network/reading-preview-fetch";
import { createReadingHttpClient } from "../../network/reading-http-client";
import { createReadingFixture } from "../../docs-reading-fixture";

test("Docs preview forwards only its own framework GETs and blocks external/product traffic and writes", async () => {
  const requests: unknown[] = [];
  const previous: typeof fetch = async input => { requests.push(input); return Response.json({ local: true }); };
  const fetcher = readingPreviewFetch("https://local.invalid", previous);
  await fetcher("/_next/static/framework.js");
  await fetcher("/work/docs-reading-preview?role=viewer");
  for (const [url, method] of [["https://external.invalid/api", "GET"], ["/api/v1/product-docs", "GET"],
    ["/work/docs-reading-preview", "POST"], ["/_next/static/framework.js", "DELETE"],
    ["/work/integration-preview", "GET"], ["https://user:pass@local.invalid/_next/file", "GET"]]) {
    await assert.rejects(fetcher(url, { method }), /blocks outbound/);
  }
  const controller = new AbortController(); controller.abort();
  await assert.rejects(fetcher("/_next/file", { signal: controller.signal }), { name: "AbortError" });
  assert.equal(requests.length, 2);
});

test("local link previews use published projection and transport mutations cannot write data", async () => {
  const fixture = createReadingFixture(false, "viewer"), http = createReadingHttpClient(fixture, "viewer");
  const preview = await http.mutateResource<{ title: string }>("/workspaces/preview/projects/host/product-docs/link-preview", "POST", { kind: "product-doc", id: "calendar" });
  assert.equal(preview.data.title, "Host calendar");
  await assert.rejects(http.getResource("/workspaces/preview/projects/host/product-docs/calendar/reviews"), { code: "PRODUCT_DOC_ACCESS_DENIED" });
  await assert.rejects(http.mutateResource("/workspaces/preview/projects/host/product-docs/calendar/delete", "POST", { expectedDraftVersion: 3 }));
  assert.deepEqual(fixture.writes, []);
});

test("local metadata reads cannot revive a deleted current document", async () => {
  const fixture = createReadingFixture(false), http = createReadingHttpClient(fixture, "workspace_admin");
  await fixture.api.delete(fixture.scope, "calendar", { expectedDraftVersion: 3 }, { idempotencyKey: "delete-metadata" });
  await assert.rejects(http.getResource("/workspaces/preview/projects/host/product-docs/calendar/reviews"), { code: "PRODUCT_DOC_NOT_FOUND" });
  await assert.rejects(http.mutateResource("/workspaces/preview/projects/host/product-docs/link-preview", "POST", { kind: "product-doc", id: "calendar" }), { code: "PRODUCT_DOC_NOT_FOUND" });
});
