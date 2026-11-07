import assert from "node:assert/strict";
import { test } from "node:test";
import { getDesktopUpdate } from "../../model/update";

const version = "0.2.10";
const baseUrl = "https://saturnusgo.com/falcon/desktop/beta/0.2.10/";
const release = { version, baseUrl, artifacts: [
  { id: "mac-arm64", file: "Falcon-0.2.10-mac-arm64-beta.dmg" },
  { id: "mac-x64", file: "Falcon-0.2.10-mac-x64-beta.dmg" },
  { id: "win-x64", file: "Falcon-0.2.10-win-x64-beta-setup.exe" },
] };
const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Electron/45.2.2";
const windows = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Electron/45.2.2";

test("only older Falcon Desktop builds see an available update", async () => {
  for (const userAgent of [
    mac, `${mac} NotFalconDesktop/0.2.7`, `${mac} FalconDesktop/0.2.10`,
    `${mac} FalconDesktop/0.2.10+test`, `${mac} FalconDesktop/0.3.0-beta.1`,
    `${mac} FalconDesktop/0.2.11`, `${mac} FalconDesktop/0.2.0.7`,
    "Mozilla/5.0 (X11; Linux x86_64) Electron/45.2.2 FalconDesktop/0.2.7",
  ]) assert.equal(await getDesktopUpdate({ userAgent }, release), null, userAgent);
});

test("the updater compares release and prerelease versions by SemVer precedence", async () => {
  assert.equal((await getDesktopUpdate({ userAgent: `${windows} FalconDesktop/0.2.10-beta.1` }, release))?.version, version);
  const betaVersion = "0.2.10-beta.10";
  const beta = { version: betaVersion, baseUrl: `https://saturnusgo.com/falcon/desktop/beta/${betaVersion}/`,
    artifacts: [{ id: "win-x64", file: `Falcon-${betaVersion}-win-x64-beta-setup.exe` }] };
  assert.equal((await getDesktopUpdate({ userAgent: `${windows} FalconDesktop/0.2.10-beta.2` }, beta))?.version, betaVersion);
  assert.equal(await getDesktopUpdate({ userAgent: `${windows} FalconDesktop/0.2.10-rc.1` }, beta), null);
});

test("each supported desktop architecture gets its official installer for the newer version", async () => {
  for (const [userAgent, architecture, file] of [
    [mac, "arm", "Falcon-0.2.10-mac-arm64-beta.dmg"],
    [mac, "x86", "Falcon-0.2.10-mac-x64-beta.dmg"],
    [windows, "x86", "Falcon-0.2.10-win-x64-beta-setup.exe"],
  ]) {
    const result = await getDesktopUpdate({ userAgent: `${userAgent} FalconDesktop/0.2.9`,
      userAgentData: { getHighEntropyValues: async () => ({ architecture, bitness: "64" }) } }, release);
    assert.deepEqual(result, { version, installer: { href: `${baseUrl}${file}`, file } });
  }
});

test("a Mac with missing or blocked architecture hints uses the Mac installer chooser", async () => {
  const userAgent = `${mac} FalconDesktop/0.2.7`;
  const chooser = { version, installer: null, macFiles: [release.artifacts[0].file, release.artifacts[1].file] };
  assert.deepEqual(await getDesktopUpdate({ userAgent }, release), chooser);
  const blockedHints = { getHighEntropyValues: async () => { throw new Error("Hints are disabled"); } };
  assert.deepEqual(await getDesktopUpdate({ userAgent, userAgentData: blockedHints }, release), chooser);
});

test("the Mac chooser drops a stale installer even when another Mac installer is current", async () => {
  const stale = { id: "mac-x64", file: "Falcon-0.2.7-mac-x64-beta.dmg" };
  assert.deepEqual(await getDesktopUpdate({ userAgent: `${mac} FalconDesktop/0.2.7` }, {
    ...release, artifacts: [release.artifacts[0], stale],
  }), { version, installer: null, macFiles: [release.artifacts[0].file] });
});

test("an update never substitutes an installer for a mismatched platform, version, or origin", async () => {
  const identity = { userAgent: `${windows} FalconDesktop/0.2.7` };
  assert.equal(await getDesktopUpdate(identity, { ...release, artifacts: release.artifacts.slice(0, 2) }), null);
  assert.equal(await getDesktopUpdate(identity, { ...release, baseUrl: "https://example.test/" }), null);
  assert.equal(await getDesktopUpdate(identity, { ...release,
    artifacts: [{ id: "win-x64", file: "Falcon-0.2.7-win-x64-beta-setup.exe" }] }), null);
});
