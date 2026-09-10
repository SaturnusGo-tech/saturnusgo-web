import assert from "node:assert/strict";
import test from "node:test";
import { readDomainBindings, verifyDomainBindings } from "../domain-binding-inventory.mjs";

const row = (hostname, id = hostname) => ({ id, hostname, service: "umbrella-home-tms-origin",
  zone_id: "5f894deaef55311e810151ca7ad30ed3", environment: "production" });
const credentials = { type: "oauth", token: "test-secret-not-in-evidence" };
const fetcher = (rows, info) => async (url, options) => {
  assert.equal(url.hostname, "api.cloudflare.com");
  assert.equal(url.searchParams.get("service"), "umbrella-home-tms-origin");
  assert.equal(options.headers.authorization, `Bearer ${credentials.token}`);
  assert.equal(options.redirect, "error");
  return Response.json({ success: true, result: rows, result_info: info });
};
test("release preserves every existing domain and tolerates provisioning during upload", async () => {
  const before = await readDomainBindings(credentials, fetcher([row("tms.saturnusgo.com"), row("alpha-falcon.saturnusgo.com")]));
  const after = await readDomainBindings(credentials, fetcher([row("bravo-falcon.saturnusgo.com"),
    row("tms.saturnusgo.com"), row("alpha-falcon.saturnusgo.com")]));
  verifyDomainBindings(before, after);
  assert.doesNotMatch(JSON.stringify(before), /test-secret/);
  for (const changed of [after.filter((item) => !item.hostname.startsWith("alpha")),
    after.map((item) => item.hostname.startsWith("alpha") ? { ...item, id: "rebound" } : item),
    after.map((item) => ({ ...item, service: "other-worker" }))]) {
    assert.throws(() => verifyDomainBindings(before, changed), /Domain binding drift/);
  }
});
test("incomplete or unavailable inventory stops deployment instead of treating it as empty", async () => {
  for (const [rows, info] of [[[], {}], [[row("tms.saturnusgo.com")], { total_pages: 2 }],
    [[row("tms.saturnusgo.com")], { total_count: 3 }],
    [[row("tms.saturnusgo.com"), row("tms.saturnusgo.com")], {}]]) {
    await assert.rejects(readDomainBindings(credentials, fetcher(rows, info)));
  }
  await assert.rejects(readDomainBindings(credentials, async () => new Response("private upstream", { status: 403 })),
    /Domain inventory unavailable \(HTTP 403\)/);
  await assert.rejects(readDomainBindings({ type: "api_key", key: "private" }), /bearer token/);
});
