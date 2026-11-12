import assert from "node:assert/strict";
import { test } from "node:test";
import release from "../../model/release.json";
import { getDesktopUpdate } from "../../model/update";
import { createLatestReleaseReader } from "../../model/latest/source";
import { parseDesktopRelease } from "../../model/latest/release";

test("an older desktop skips the bundled intermediate release and loads the current published installer", async t => {
  const version = "0.2.12", requests: { url: string; init?: RequestInit }[] = [];
  const latest = { ...release, version, baseUrl: `https://saturnusgo.com/falcon/desktop/beta/${version}/`,
    artifacts: release.artifacts.map(artifact => ({ ...artifact, file: artifact.file.replace(release.version, version) })) };
  t.mock.method(globalThis, "fetch", async (url: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(url), init }); return Response.json(latest);
  });
  const update = await getDesktopUpdate({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FalconDesktop/0.2.9" });
  assert.equal(update?.version, version);
  assert.equal(update?.installer?.href, `${latest.baseUrl}Falcon-${version}-win-x64-beta-setup.exe`);
  assert.equal(requests.length, 1); assert.ok(requests[0].url.startsWith("/falcon/desktop/beta/latest.json?check="));
  assert.equal(requests[0].init?.cache, "no-store"); assert.equal(requests[0].init?.credentials, "omit");
  assert.equal(requests[0].init?.redirect, "error");
});

test("every read bypasses caches and rejects older responses after a newer version was observed", async () => {
  let version = "0.2.12"; const urls: string[] = [];
  const read = createLatestReleaseReader(async (url, init) => {
    urls.push(String(url)); assert.equal(init?.cache, "no-store"); assert.equal(init?.credentials, "omit");
    return Response.json({ ...release, version, baseUrl: `https://saturnusgo.com/falcon/desktop/beta/${version}/`,
      artifacts: release.artifacts.map(artifact => ({ ...artifact, file: artifact.file.replace(release.version, version) })) });
  }, "0.2.10");
  assert.equal((await read()).version, version); version = "0.2.13"; assert.equal((await read()).version, version);
  version = "0.2.12"; await assert.rejects(read(), /Stale desktop release/); assert.equal(urls.length, 3);
});

test("offline, unavailable, malformed and unsafe metadata fail closed instead of falling back to a bundled installer", async () => {
  for (const response of [new Response("Unavailable", { status: 503 }), Response.json({}), Response.json({ ...release, baseUrl: "https://attacker.test/" })]) {
    await assert.rejects(createLatestReleaseReader(async () => response, "0.2.10")());
  }
  await assert.rejects(createLatestReleaseReader(async () => { throw new Error("Offline"); })(), /Offline/);
  for (const changed of [
    { version: "0.2.11-beta.01" }, { baseUrl: "http://saturnusgo.com/falcon/desktop/beta/0.2.11/" },
    { artifacts: [release.artifacts[0], release.artifacts[0], release.artifacts[2]] },
    { artifacts: release.artifacts.map(file => ({ ...file, file: "../installer.dmg" })) },
    { artifacts: release.artifacts.map(file => ({ ...file, sha256: "invalid" })) },
  ]) assert.throws(() => parseDesktopRelease({ ...release, ...changed }));
});

test("the current or newer installed version is never offered a downgrade from valid remote metadata", async () => {
  const current = parseDesktopRelease(release);
  assert.equal(await getDesktopUpdate({ userAgent: `Windows NT FalconDesktop/${current.version}` }, current), null);
  assert.equal(await getDesktopUpdate({ userAgent: "Windows NT FalconDesktop/99.0.0" }, current), null);
});
