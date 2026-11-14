import assert from "node:assert/strict";
import { test } from "node:test";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { createDatasetClient } from "../../data/datasets/dataset-client";
import { createCredentialClient } from "../../data/credentials/credential-client";
const base = "/workspaces/work/projects/project/test-data";
const dataset = { id: "d", name: "Boundary", description: "", environmentId: null, status: "ACTIVE", currentVersionId: "v1", currentVersion: 1, revision: 3, fieldCount: 1, usedIn: 7, createdAt: "2026-11-14T00:00:00Z", updatedAt: "2026-11-14T00:00:00Z" };
function http(handle: (path: string, init: RequestInit) => unknown) {
  return createTmsHttpClient({ apiBase: "https://falcon.example.test/api/v1", credentials: "include", fetch: (async (url, init) =>
    new Response(JSON.stringify(handle(new URL(String(url)).pathname + new URL(String(url)).search, init ?? {})), { headers: { "content-type": "application/json" } })) as typeof fetch });
}
test("dataset transport preserves exact numeric and JSON text, version concurrency and usage metadata", async () => {
  const requests: Array<{ path: string; init: RequestInit }> = [];
  const client = createDatasetClient(http((path, init) => { requests.push({ path, init }); return path.includes("?") ? { data: [dataset], page: { nextCursor: "opaque-next" } } : { data: dataset }; }), base);
  const signal = new AbortController().signal;
  const page = await client.datasets("Boundary", null, signal);
  assert.equal(page.items[0].usedIn, 7); assert.equal(page.cursor, "opaque-next");
  const exact = "9007199254740993.0000000001", json = '{"amount":9007199254740993}';
  await client.saveDataset({ name: "Boundary", description: "", environmentId: null, fields: [{ key: "amount", type: "Decimal", value: exact }, { key: "payload", type: "JSON", value: json }] }, page.items[0], "retry-key", signal);
  const request = requests[1];
  assert.equal(request.path, `/api/v1${base}/datasets/d/versions`);
  assert.equal(new Headers(request.init.headers).get("if-match"), '"tdm:d:3"');
  assert.equal(new Headers(request.init.headers).get("idempotency-key"), "retry-key");
  assert.deepEqual(JSON.parse(String(request.init.body)).fields.map((field: { value: string }) => field.value), [exact, json]);
});
test("credential metadata adapter never retains a secret even if an incorrect server includes one in non-secret values", async () => {
  const client = createCredentialClient(http(() => ({ data: { id: "c", name: "Account", description: "", environmentId: "env", rowVersion: 2, fields: [{ key: "password", type: "String", isSecret: true }, { key: "email", type: "Email", isSecret: false }], nonSecretValues: { password: "must-not-retain", email: "qa@example.test" }, activeSecretVersionId: "s2", usedIn: 2, status: "active", updatedAt: "2026-11-14T00:00:00Z" } })), base, "work", "project");
  const value = await client.credential("c", new AbortController().signal);
  assert.equal(value.fields[0].value, undefined);
  assert.equal(JSON.stringify(value).includes("must-not-retain"), false);
  assert.equal(value.fields[1].value, "qa@example.test");
});
test("reveal requires explicit reauthentication and an action-bound proof before single-field materialization", async () => {
  const calls: Array<{ path: string; body: unknown }> = [];
  const client = createCredentialClient(http((path, init) => {
    calls.push({ path, body: JSON.parse(String(init.body)) });
    return { data: path.endsWith("credential-reveal-proof") ? { proof: "one-use", expiresAt: "2026-11-14T00:02:00Z" } : path.endsWith("/reveal") ? { value: "ephemeral", displayTimeoutSeconds: 30 } : {} };
  }), base, "work", "project");
  const start = Date.now();
  const result = await client.reveal({ resourceId: "c", field: "password", environmentId: "env", secretVersionId: "s2", executionId: "execution" }, "Manual QA", { currentPassword: "own-password", code: "123456", recovery: false }, new AbortController().signal);
  assert.deepEqual(calls.map(call => call.path), ["/api/v1/profile/reauthenticate", "/api/v1/profile/credential-reveal-proof", `/api/v1${base}/credentials/c/reveal`]);
  assert.deepEqual(calls[1].body, { workspaceId: "work", projectId: "project", credentialId: "c", field: "password", secretVersionId: "s2", executionId: "execution" });
  assert.equal((calls[2].body as { stepUpProof: string }).stepUpProof, "one-use");
  assert.equal(result.value, "ephemeral"); assert.ok(result.expiresAt >= start + 30_000 && result.expiresAt <= Date.now() + 30_000);
  await client.reveal({ resourceId: "c", field: "password", environmentId: "env", secretVersionId: "s2" }, "   ", { currentPassword: "own-password", code: "", recovery: false }, new AbortController().signal);
  assert.equal("reason" in (calls[5].body as object), false);
});
