import assert from "node:assert/strict";
import test from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { AdministrationError } from "../../../company-administration/domain/administration";
import { createCompanyCodexAdminApi } from "../../data/admin/company-codex-admin-api";
import { status } from "../support/employee-fixture";

test("company management uses bounded company routes, conditional versions and explicit idempotency", async () => {
  const calls: { url: URL; init: RequestInit | undefined }[] = [];
  const http = createTmsHttpClient({ apiBase: "https://tenant.example/api/v1", credentials: "include", fetch: async (input, init) => {
    calls.push({ url: new URL(String(input)), init });
    return Response.json(init?.method === "POST" ? { data: {} } : { data: [], page: { nextCursor: "next-page" } });
  }});
  const api = createCompanyCodexAdminApi(http), signal = new AbortController().signal;
  const page = await api.connections("active", "opaque+cursor", signal);
  assert.equal(page.nextCursor, "next-page");
  assert.equal(calls[0].url.pathname, "/api/v1/company/agents/codex/connections");
  assert.equal(calls[0].url.searchParams.get("limit"), "20");
  assert.equal(calls[0].url.searchParams.get("status"), "active");
  assert.equal(calls[0].url.searchParams.get("cursor"), "opaque+cursor");
  await api.activate({ ...status, etag: null }, "activate-key-123", signal);
  assert.equal(new Headers(calls[1].init?.headers).get("if-match"), null);
  assert.equal(new Headers(calls[1].init?.headers).get("idempotency-key"), "activate-key-123");
  await api.deactivate({ ...status, etag: '"3"' }, "deactivate-key-123", signal);
  assert.equal(new Headers(calls[2].init?.headers).get("if-match"), '"3"');
  await api.revoke("grant/one", "revoke-key-123", signal);
  assert.equal(calls[3].url.pathname, "/api/v1/company/agents/codex/connections/grant%2Fone/revoke");
  assert.equal(new Headers(calls[3].init?.headers).get("idempotency-key"), "revoke-key-123");
  assert.ok(calls.every(call => !call.url.pathname.includes("/profile/")));
});

test("administrator authorization failures remain backend errors rather than local success", async () => {
  const api = createCompanyCodexAdminApi(createTmsHttpClient({ apiBase: "https://tenant.example/api/v1", credentials: "include",
    fetch: async () => Response.json({ error: { code: "ACCESS_DENIED", message: "Denied", requestId: "request-one" } }, { status: 403 }) }));
  await assert.rejects(api.revoke("grant-one", "key-123", new AbortController().signal), error => error instanceof AdministrationError && error.code === "ACCESS_DENIED");
});
