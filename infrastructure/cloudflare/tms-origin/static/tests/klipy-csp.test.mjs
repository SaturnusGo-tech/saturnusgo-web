import assert from "node:assert/strict";
import test from "node:test";
import worker from "../../worker.mjs";

test("the served document permits direct KLIPY images only from its three exact CDN origins", async context => {
  const original = globalThis.fetch;
  context.after(() => { globalThis.fetch = original; });
  globalThis.fetch = async () => new Response("Falcon", { headers: { "content-type": "text/html" } });
  const response = await worker.fetch(new Request("https://tms.saturnusgo.com/cloud-login/"));
  assert.equal(response.status, 200);
  const directive = response.headers.get("content-security-policy").split(";")
    .map(value => value.trim()).find(value => value.startsWith("img-src "));
  assert.ok(directive);
  const sources = directive.split(/\s+/).slice(1);
  for (const host of ["static.klipy.com", "static1.klipy.com", "static2.klipy.com"]) {
    assert.ok(sources.includes(`https://${host}`), `direct GIF loading must allow ${host}`);
  }
  assert.equal(sources.includes("https:"), false, "other HTTPS image origins remain blocked");
  assert.equal(sources.some(source => source.includes("klipy.com") && source.includes("*")), false);
  assert.equal(sources.includes("https://klipy.com"), false, "the content page host is not an image CDN");
  assert.equal(sources.includes("https://static.klipy.com.evil.test"), false);
  assert.ok(sources.includes("https://*.r2.cloudflarestorage.com"), "existing private images retain access");
  assert.ok(sources.includes("https://saturnusgo.com"), "published profile banners load from the owned R2 CDN");
  assert.equal(sources.includes("https://*.saturnusgo.com"), false, "profile banners do not allow every company origin");
  assert.equal(sources.includes("https://saturnusgo.com.evil.test"), false);
});
