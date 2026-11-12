import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { AdministrationError, type DeviceSession } from "../../domain/administration";
import { installSecurityControls } from "../support/security-controls";

const require = createRequire(import.meta.url);
const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
let Sessions: typeof import("../../presentation/devices/ProfileSessions")["ProfileSessions"];
let ErrorToast: typeof import("../../../presentation/common/error/ErrorToast")["ErrorToast"];
before(async () => {
  Object.assign(globalThis, { React }); const restore = installSecurityControls();
  try {
    ({ ProfileSessions: Sessions } = require("../../presentation/devices/ProfileSessions"));
    ({ ErrorToast } = require("../../../presentation/common/error/ErrorToast"));
  } finally { restore(); }
});
after(() => {
  if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React");
});
const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
const chrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131.0.0.0 Safari/537.36";
const rows: DeviceSession[] = [
  { id: "current", current: true, userAgent: chrome, stage: "authenticated", createdAt: "2026-11-04T09:00:00Z", expiresAt: "2026-11-14T09:00:00Z" },
  { id: "other", current: false, userAgent: "Firefox/132.0 (Windows NT 10.0)", stage: "authenticated", createdAt: "2026-11-03T09:00:00Z", expiresAt: "2026-11-13T09:00:00Z" },
];
const wrap = (client: AdministrationPort, key = "account", onPendingChange?: (pending: boolean) => void) => <TmsLocaleContext.Provider value={locale}><Sessions key={key} client={client} version={0} showHeading={false} onPendingChange={onPendingChange} /></TmsLocaleContext.Provider>;
const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
const buttons = (root: ReactTestInstance) => root.findAllByType("button");
const hasLabel = (node: ReactTestInstance, label: string) => React.Children.toArray(node.props.children).includes(label);
const action = (root: ReactTestInstance, label: string) => {
  const button = buttons(root).find(node => hasLabel(node, label));
  assert.ok(button, label); return button;
};
const press = (button: ReactTestInstance) => (button.props.onPress ?? button.props.onClick)();

test("confirmation focuses Cancel after the modal focus frame and cancels a queued focus on unmount", async () => {
  const previousFrame = Object.getOwnPropertyDescriptor(globalThis, "requestAnimationFrame"), previousCancel = Object.getOwnPropertyDescriptor(globalThis, "cancelAnimationFrame");
  const frames = new Map<number, FrameRequestCallback>(), focused: string[] = []; let serial = 0, view!: ReactTestRenderer;
  Object.assign(globalThis, { requestAnimationFrame: (callback: FrameRequestCallback) => { frames.set(++serial, callback); return serial; }, cancelAnimationFrame: (id: number) => frames.delete(id) });
  const client = { sessions: async () => ({ items: rows, nextCursor: null }) } as unknown as AdministrationPort;
  try {
    await act(async () => { view = create(wrap(client), { createNodeMock: element => element.type === "button" ? {
      disabled: element.props.disabled, focus: () => focused.push(React.Children.toArray(element.props.children).join("")),
    } : null }); }); await settle();
    await act(async () => { press(action(view.root, "End session")); });
    assert.equal(frames.size, 1); assert.deepEqual(focused, []);
    await act(async () => { for (const [id, callback] of frames) { frames.delete(id); callback(0); } });
    assert.deepEqual(focused, ["Cancel"]);
    await act(async () => { press(action(view.root, "Cancel")); });
    await act(async () => { press(action(view.root, "End session")); });
    assert.equal(frames.size, 1);
    await act(async () => { view.unmount(); }); assert.equal(frames.size, 0);
  } finally {
    await act(async () => view?.unmount());
    if (previousFrame) Object.defineProperty(globalThis, "requestAnimationFrame", previousFrame); else Reflect.deleteProperty(globalThis, "requestAnimationFrame");
    if (previousCancel) Object.defineProperty(globalThis, "cancelAnimationFrame", previousCancel); else Reflect.deleteProperty(globalThis, "cancelAnimationFrame");
  }
});

test("current session retains browser and OS; ending another session requires explicit confirmation or cancels safely", async () => {
  let view!: ReactTestRenderer; const revoked: string[] = [], pending: boolean[] = [];
  const client = { sessions: async () => ({ items: rows, nextCursor: null }), revokeSession: async (id: string) => { revoked.push(id); } } as unknown as AdministrationPort;
  try {
    await act(async () => { view = create(wrap(client, "account", value => pending.push(value))); }); await settle();
    assert.deepEqual(view.root.findAllByType("strong").map(node => node.children.join("")), ["Chrome · macOS", "Firefox · Windows"]);
    assert.equal(buttons(view.root).filter(node => hasLabel(node, "End session")).length, 1);
    await act(async () => { press(action(view.root, "End session")); });
    assert.deepEqual(revoked, []);
    assert.deepEqual(pending, []);
    assert.equal(view.root.findAllByProps({ role: "group" }).length, 1);
    await act(async () => { press(action(view.root, "Cancel")); });
    assert.deepEqual(revoked, []);
    assert.deepEqual(pending, []);
    assert.equal(view.root.findAllByProps({ role: "group" }).length, 0);
    assert.equal(view.root.findAllByType("h2").length, 0);
  } finally { await act(async () => view?.unmount()); }
});

test("confirmed revocation is single-flight, refreshes on success, and offers retry through the existing toast contract", async () => {
  let view!: ReactTestRenderer, finish!: () => void; const revoked: string[] = [], events: string[] = []; let removed = false, fail = true;
  const client = { sessions: async () => ({ items: removed ? rows.slice(0, 1) : rows, nextCursor: null }),
    revokeSession: async (id: string) => { events.push("transport"); revoked.push(id); if (fail) throw new AdministrationError("SERVICE_UNAVAILABLE");
      await new Promise<void>(resolve => { finish = () => { removed = true; resolve(); }; }); } } as unknown as AdministrationPort;
  try {
    await act(async () => { view = create(wrap(client, "account", value => events.push(`pending:${value}`))); }); await settle();
    await act(async () => { press(action(view.root, "End session")); });
    await act(async () => { press(action(view.root.findByProps({ role: "group" }), "End session")); });
    assert.deepEqual(revoked, ["other"]);
    assert.deepEqual(events, ["pending:true", "transport", "pending:false"]);
    assert.ok(view.root.findAllByType(ErrorToast).some(node => typeof node.props.message === "string" && node.props.message.length > 0));
    assert.equal(view.root.findAllByProps({ role: "group" }).length, 1);
    fail = false;
    const confirm = action(view.root.findByProps({ role: "group" }), "End session");
    await act(async () => { press(confirm); press(confirm); });
    assert.deepEqual(revoked, ["other", "other"]);
    assert.deepEqual(events, ["pending:true", "transport", "pending:false", "pending:true", "transport"]);
    assert.equal(action(view.root.findByProps({ role: "group" }), "Cancel").props.disabled, true);
    assert.equal(view.root.findAllByProps({ "data-loading-orb": "solving" }).length, 1);
    await act(async () => { finish(); }); await settle();
    assert.equal(view.root.findAllByProps({ role: "group" }).length, 0);
    assert.equal(buttons(view.root).filter(node => hasLabel(node, "End session")).length, 0);
    assert.deepEqual(events, ["pending:true", "transport", "pending:false", "pending:true", "transport", "pending:false"]);
  } finally { await act(async () => view?.unmount()); }
});

test("unmount releases the accepted pending owner once; its late result cannot unlock the next account", async () => {
  let view!: ReactTestRenderer, finishOld!: () => void, finishNext!: () => void, signal!: AbortSignal;
  const events: string[] = [];
  const first = { sessions: async () => ({ items: rows, nextCursor: null }), revokeSession: async (_id: string, request: AbortSignal) => {
    signal = request; await new Promise<void>(resolve => { finishOld = resolve; });
  } } as unknown as AdministrationPort;
  const next = { sessions: async () => ({ items: rows, nextCursor: null }), revokeSession: async () => {
    await new Promise<void>(resolve => { finishNext = resolve; });
  } } as unknown as AdministrationPort;
  try {
    await act(async () => { view = create(wrap(first, "old", value => events.push(`old:${value}`))); }); await settle();
    await act(async () => { press(action(view.root, "End session")); });
    await act(async () => { press(action(view.root.findByProps({ role: "group" }), "End session")); });
    assert.deepEqual(events, ["old:true"]);
    await act(async () => { view.update(wrap(next, "next", value => events.push(`next:${value}`))); }); await settle();
    assert.equal(signal.aborted, true); assert.deepEqual(events, ["old:true", "old:false"]);
    await act(async () => { press(action(view.root, "End session")); });
    await act(async () => { press(action(view.root.findByProps({ role: "group" }), "End session")); });
    await act(async () => { finishOld(); });
    assert.deepEqual(events, ["old:true", "old:false", "next:true"]);
    await act(async () => { finishNext(); });
    assert.deepEqual(events, ["old:true", "old:false", "next:true", "next:false"]);
  } finally { await act(async () => view?.unmount()); }
  assert.deepEqual(events, ["old:true", "old:false", "next:true", "next:false"]);
});

test("paging stays available and an account unmount aborts old work without carrying confirmation into the new account", async () => {
  let view!: ReactTestRenderer, oldSignal: AbortSignal | undefined; const cursors: (string | null)[] = [], revoked: string[] = [];
  const first = { sessions: async (cursor: string | null) => { cursors.push(cursor); return { items: cursor ? rows.slice(1) : rows.slice(0, 1), nextCursor: cursor ? null : "next" }; },
    revokeSession: async (id: string, signal: AbortSignal) => { revoked.push(id); oldSignal = signal; await new Promise<void>(() => {}); } } as unknown as AdministrationPort;
  const next = { sessions: async () => ({ items: rows.slice(0, 1), nextCursor: null }), revokeSession: async () => { throw new Error("Wrong account"); } } as unknown as AdministrationPort;
  try {
    await act(async () => { view = create(wrap(first)); }); await settle();
    await act(async () => { press(action(view.root, "Load more")); });
    assert.deepEqual(cursors, [null, "next"]);
    await act(async () => { press(action(view.root, "End session")); });
    await act(async () => { press(action(view.root.findByProps({ role: "group" }), "End session")); });
    await act(async () => { view.update(wrap(next, "new-account")); }); await settle();
    assert.equal(oldSignal?.aborted, true);
    assert.deepEqual(revoked, ["other"]);
    assert.equal(view.root.findAllByProps({ role: "group" }).length, 0);
    assert.equal(buttons(view.root).filter(node => hasLabel(node, "End session")).length, 0);
  } finally { await act(async () => view?.unmount()); }
});
