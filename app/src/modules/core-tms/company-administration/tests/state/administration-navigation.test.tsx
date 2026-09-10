import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useAdministrationNavigation } from "../../application/navigation/useAdministrationNavigation";

void test("admin tabs use local history, discard detail state and restore the selected tab on Back", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  const events = new EventTarget();
  let url = new URL("https://tenant.example/admin/?id=member-a");
  const entries: string[] = [];
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    get location() { return url; },
    history: { pushState(_state: unknown, _title: string, href: string) { entries.push(url.href); url = new URL(href, url); } },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), scrollTo() {},
  }});
  let current!: ReturnType<typeof useAdministrationNavigation>;
  function Probe() { current = useAdministrationNavigation(); return null; }
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(<Probe />); });
    assert.equal(current.route.id, "member-a");
    await act(async () => current.navigate({ section: "admin", page: "audit", id: null, creating: false }));
    assert.equal(url.pathname, "/admin/"); assert.equal(url.search, "?page=audit");
    assert.equal(current.route.page, "audit"); assert.equal(current.route.id, null);
    await act(async () => { url = new URL(entries.pop()!); events.dispatchEvent(new Event("popstate")); });
    assert.equal(current.route.id, "member-a"); assert.equal(current.route.page, undefined);
    await act(async () => current.navigate({ section: "profile", id: null, creating: false }));
    assert.equal(url.pathname, "/profile/"); assert.equal(current.route.section, "profile");
  } finally {
    await act(async () => renderer?.unmount());
    if (original) Object.defineProperty(globalThis, "window", original); else Reflect.deleteProperty(globalThis, "window");
  }
});
