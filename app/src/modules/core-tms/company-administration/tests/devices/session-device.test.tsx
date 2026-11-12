import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { Monitor, Smartphone } from "lucide-react";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { installSecurityControls } from "../support/security-controls";

const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const chrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const require = createRequire(import.meta.url);
const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
let Sessions: typeof import("../../presentation/devices/ProfileSessions")["ProfileSessions"];
before(async () => {
  Object.assign(globalThis, { React }); const restore = installSecurityControls();
  try { ({ ProfileSessions: Sessions } = require("../../presentation/devices/ProfileSessions")); } finally { restore(); }
});
after(() => {
  if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React");
});

test("session rows use compact device labels and appropriate icons while retaining current-session revoke protection", async () => {
  const revoked: string[] = []; let view!: ReactTestRenderer;
  const client = { sessions: async () => ({ items: [
    { id: "current", current: true, userAgent: chrome, createdAt: "2026-11-04T09:00:00Z" },
    ...revoked.length ? [] : [{ id: "phone", current: false, userAgent: iphone, createdAt: "2026-11-03T09:00:00Z" }],
  ], nextCursor: null }), revokeSession: async (id: string) => { revoked.push(id); } } as unknown as AdministrationPort;
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
  try {
    await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><Sessions client={client} version={0} /></TmsLocaleContext.Provider>); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    assert.deepEqual(view.root.findAllByType("strong").map(node => node.children.join("")), ["Chrome · macOS", "Safari · iPhone"]);
    assert.equal(view.root.findAll(node => node.type === (Smartphone as unknown)).length, 1);
    assert.equal(view.root.findAll(node => node.type === (Monitor as unknown)).length, 1);
    assert.equal(JSON.stringify(view.toJSON()).includes("Mozilla"), false);
    const buttons = view.root.findAllByType("button").filter(node => node.children.includes("End session"));
    assert.equal(buttons.length, 1);
    await act(async () => { buttons[0].props.onClick(); buttons[0].props.onClick(); });
    assert.deepEqual(revoked, []);
    const confirm = view.root.findByProps({ role: "group" }).findAllByType("button").find(node => node.children.includes("End session"));
    assert.ok(confirm);
    await act(async () => { confirm.props.onClick(); confirm.props.onClick(); });
    assert.deepEqual(revoked, ["phone"]);
  } finally { await act(async () => view?.unmount()); }
});

test("UA recognition orders browser variants before shared Chrome and Safari tokens", async () => {
  const { sessionDevice } = await import("../../presentation/devices/session-device");
  for (const [ua, label, mobile] of [
    [iphone, "Safari · iPhone", true], [chrome, "Chrome · macOS", false],
    [chrome.replace("Chrome/131.0.0.0", "CriOS/131.0.0.0").replace("Macintosh; Intel Mac OS X 10_15_7", "iPhone; CPU iPhone OS 18_0"), "Chrome · iPhone", true],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0", "Edge · Windows", false],
    ["Mozilla/5.0 (Linux; Android 15) Chrome/131.0.0.0 Mobile Safari/537.36 SamsungBrowser/26.0", "Samsung Internet · Android", true],
    ["Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0", "Firefox · Linux", false],
    ["Mozilla/5.0 (X11; CrOS x86_64 16000.0.0) Chrome/131.0.0.0 Safari/537.36", "Chrome · ChromeOS", false],
  ] as const) assert.deepEqual(sessionDevice(ua), { label, mobile });
});

test("unknown or missing user agents never become raw labels", async () => {
  const { sessionDevice } = await import("../../presentation/devices/session-device");
  for (const ua of [null, undefined, "", "Unrecognized very long browser signature".repeat(100)]) {
    assert.deepEqual(sessionDevice(ua), { label: "Falcon", mobile: false });
  }
});
