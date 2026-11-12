import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useSecurityDialog } from "../../application/useSecurityDialog";

Object.assign(globalThis, { React });
test("security actions retain legacy hashes, browser navigation and the pending dismissal guard", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  const events = new EventTarget();
  const location = new URL("https://falcon.test/work/?settings=security#sessions");
  const history = { state: {}, pushState: (_: unknown, __: string, href: string) => { location.href = new URL(href, location).href; },
    replaceState: (_: unknown, __: string, href: string) => { location.href = new URL(href, location).href; } };
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location, history,
    sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) } });
  let model!: ReturnType<typeof useSecurityDialog>, view!: ReactTestRenderer;
  function Hook() { model = useSecurityDialog(); return null; }
  try {
    await act(async () => { view = create(<Hook/>); });
    assert.equal(model.screen, "sessions");
    await act(async () => model.close());
    assert.equal(model.screen, null); assert.equal(location.hash, "");
    await act(async () => model.open("password"));
    assert.equal(location.hash, "#security"); assert.equal(model.screen, "password");
    await act(async () => model.setPending(true));
    await act(async () => model.close());
    assert.equal(model.screen, "password"); assert.equal(model.pending, true);
    await act(async () => model.setPending(false));
    await act(async () => model.close());
    assert.equal(model.screen, null);
    await act(async () => { location.hash = "sessions"; events.dispatchEvent(new Event("popstate")); });
    assert.equal(model.screen, "sessions");
    await act(async () => { location.hash = ""; events.dispatchEvent(new Event("hashchange")); });
    assert.equal(model.screen, null);
    await act(async () => model.open("password"));
    await act(async () => model.setPending(true));
    await act(async () => { location.hash = ""; events.dispatchEvent(new Event("popstate")); });
    assert.equal(model.screen, "password");
    await act(async () => model.setPending(false));
    assert.equal(model.screen, null, "settling the request must honor navigation deferred while pending");
  } finally {
    await act(async () => view?.unmount());
    if (previous) Object.defineProperty(globalThis, "window", previous); else Reflect.deleteProperty(globalThis, "window");
  }
});
