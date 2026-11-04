import assert from "node:assert/strict";
import { test } from "node:test";
import { createCompanySsoClient } from "../../data/company-sso-client";
void test("SSO administration saves the current version with credentials and no cache", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const send: typeof fetch = async (url, init) => { calls.push({ url: String(url), init }); return Response.json({ data: {} }); };
  const client = createCompanySsoClient(send);
  const draft = { version: 3, idpIssuer: "idp", entryPoint: "https://idp.example.test/sso", subjectAttribute: "NameID", certificates: ["certificate"] };
  await client.save(draft, new AbortController().signal);
  assert.equal(calls[0].url, "/api/v1/company/sso");
  assert.equal(calls[0].init?.method, "PUT");
  assert.equal(calls[0].init?.credentials, "include");
  assert.equal(calls[0].init?.cache, "no-store");
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), draft);
});
void test("SSO administration preserves safe conflict and reauthentication codes", async () => {
  const client = createCompanySsoClient(async () => Response.json({ error: { code: "REAUTHENTICATION_REQUIRED" } }, { status: 403 }));
  await assert.rejects(client.enforce(3, true, new AbortController().signal), { code: "REAUTHENTICATION_REQUIRED" });
});
