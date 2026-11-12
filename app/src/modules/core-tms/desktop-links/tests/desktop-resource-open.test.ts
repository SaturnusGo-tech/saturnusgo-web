import assert from "node:assert/strict";
import { test } from "node:test";
import { createDesktopResourceOpener } from "../application/desktop-resource-open";

const resource = "https://umbrella-falcon.saturnusgo.com/work/?workspaceId=space&projectId=host&view=cases&caseId=case";
const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/142.0";
function harness(userAgent = mac, storage = new Map<string, string>()) {
  const launched: string[] = [];
  const open = createDesktopResourceOpener({ userAgent, now: () => 1000,
    read: key => storage.get(key) ?? null, write: (key, value) => { storage.set(key, value); },
    launch: address => { launched.push(address); } });
  return { open, launched, storage };
}

test("direct resource entry offers the native browser prompt once without replacing its HTTPS fallback", () => {
  const h = harness();
  assert.equal(h.open(resource, "automatic"), true);
  assert.equal(h.open(resource, "automatic"), false);
  assert.equal(new URL(h.launched[0]).searchParams.get("url"), resource);
  assert.equal(h.launched.length, 1);
  const refreshed = harness(mac, h.storage);
  assert.equal(refreshed.open(resource, "automatic"), false);
  assert.equal(refreshed.open(resource, "explicit"), true);
  assert.equal(refreshed.launched.length, 1);
});

test("ordinary workspace startup, mobile devices and Falcon Desktop itself never auto launch a protocol", () => {
  assert.equal(harness().open(resource.replace("&caseId=case", "").replace("view=cases", "view=dashboard"), "automatic"), false);
  for (const userAgent of [`${mac} FalconDesktop/0.2.9`, "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", "Mozilla/5.0 (X11; Linux x86_64)"]) {
    const h = harness(userAgent);
    assert.equal(h.open(resource, "automatic"), false);
    assert.equal(h.open(resource, "explicit"), false);
    assert.equal(h.launched.length, 0);
  }
  const windows = harness("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
  assert.equal(windows.open(resource, "automatic"), true);
});

test("blocked local storage or unhandled external protocols leave the web page in place and do not loop", () => {
  let attempts = 0;
  const open = createDesktopResourceOpener({ userAgent: mac, now: () => 1,
    read: () => { throw new Error("denied"); }, write: () => { throw new Error("denied"); },
    launch: () => { attempts++; throw new Error("no handler"); } });
  assert.equal(open(resource, "automatic"), false);
  assert.equal(open(resource, "automatic"), false);
  assert.equal(attempts, 1);
  assert.equal(open(resource, "explicit"), false);
  assert.equal(attempts, 2);
});
