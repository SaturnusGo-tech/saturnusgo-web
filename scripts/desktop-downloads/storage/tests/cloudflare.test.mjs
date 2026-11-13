import assert from "node:assert/strict";
import { test } from "node:test";
import { createCloudflareStore } from "../cloudflare.mjs";
import { releaseObjects } from "../../retention/fixtures/store.mjs";
async function store(t, request) {
  const previous = process.env.CLOUDFLARE_API_TOKEN; process.env.CLOUDFLARE_API_TOKEN = "controlled-token";
  t.after(() => previous === undefined ? delete process.env.CLOUDFLARE_API_TOKEN : process.env.CLOUDFLARE_API_TOKEN = previous);
  return createCloudflareStore({ accountId: "a".repeat(32), request });
}
test("R2 pagination accepts the observed final page without result_info and keeps exact prefix", async t => {
  const objects = releaseObjects("0.2.10"); let calls = 0;
  const s = await store(t, async url => {
    assert.equal(new URL(url).searchParams.get("prefix"), "falcon/desktop/beta/");
    if (++calls === 1) return Response.json({ success: true, result: objects.slice(0, 2), result_info: { is_truncated: true, cursor: "next" } });
    assert.equal(new URL(url).searchParams.get("cursor"), "next");
    return Response.json({ success: true, result: objects.slice(2) });
  });
  assert.equal((await s.list()).length, 4);
});
test("unknown identities, repeated cursors and truncated pages without cursors fail closed", async t => {
  for (const result of [
    { result: [{ ...releaseObjects("0.2.10")[0], key: "other/shared.png" }] },
    { result: [], result_info: { is_truncated: true, cursor: "same" } },
    { result: [], result_info: { is_truncated: true } },
  ]) {
    const s = await store(t, async () => Response.json({ success: true, ...result }));
    await assert.rejects(s.list(), /Invalid|Repeated|cursor/);
  }
});
test("storage refuses pointer, metadata, shared asset and unknown installer deletion", async t => {
  let requests = 0;
  const s = await store(t, async () => { requests++; return new Response(null, { status: 204 }); });
  for (const key of ["falcon/desktop/beta/latest.json", "falcon/desktop/beta/_retention/releases/x.json", "shared/asset.png", "falcon/desktop/beta/0.2.10/unknown.zip", "falcon/desktop/beta/../Falcon-..-mac-arm64-beta.dmg"]) await assert.rejects(s.remove(key), /Refusing/);
  assert.equal(requests, 0);
  await s.remove(releaseObjects("0.2.10")[0].key); assert.equal(requests, 1);
});
