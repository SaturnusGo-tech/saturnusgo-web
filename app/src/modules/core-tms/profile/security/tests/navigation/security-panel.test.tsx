import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import { TmsSessionProvider } from "../../../../auth/presentation/session/TmsSessionContext";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { installSecurityControls } from "../../../../company-administration/tests/support/security-controls";
import type { Profile } from "../../../../company-administration/domain/administration";

Object.assign(globalThis, { React });
const restore = installSecurityControls();
const { SecuritySettings } = require("../../../../presentation/config/security/SecuritySettings") as typeof import("../../../../presentation/config/security/SecuritySettings");
restore();
const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };

test("focused security actions clear secrets on close and identity changes, and wait for password submission", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window"), previousFetch = globalThis.fetch;
  const events = new EventTarget(), location = new URL("https://falcon.test/work/?settings=security");
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location,
    history: { state: {}, pushState: (_: unknown, __: string, href: string) => { location.href = new URL(href, location).href; }, replaceState: () => {} },
    sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) } });
  globalThis.fetch = async () => new Response(JSON.stringify({ data: { google: false, email: true, company: true } }), { headers: { "content-type": "application/json" } });
  let profile: Profile = { id: "a", name: "Alex", login: "alex", email: "alex@example.invalid", emailVerified: true,
    phone: "", role: "tester", owner: false, hasAvatar: false, version: 1, mfaEnabled: true, emailChangeAvailable: false };
  let settle!: () => void, writes = 0, view!: ReactTestRenderer;
  const signals: AbortSignal[] = [];
  const http = { getResource: async (_: string, signal: AbortSignal) => { signals.push(signal); return { data: profile }; },
    mutateResource: async () => { writes++; await new Promise<void>(resolve => { settle = resolve; }); return { data: {} }; },
  } as unknown as TmsHttpClient;
  const render = (subject = "a", workspaceId = "workspace-a") => <TmsLocaleContext.Provider value={locale}>
    <TmsSessionProvider value={{ kind: "managed", subject, workspaceId, label: subject, signOut: async () => {} }}>
      <TmsHttpClientProvider client={http}><SecuritySettings/></TmsHttpClientProvider>
    </TmsSessionProvider>
  </TmsLocaleContext.Provider>;
  const press = async (text: string) => act(async () => {
    view.root.findAllByType("button").find(button => button.children.includes(text))!.props.onClick();
  });
  const closeButton = () => view.root.findAllByType("button").find(button => button.props["aria-label"] === "Close")!;
  const fill = async () => act(async () => {
    view.root.findAllByType("input").filter(input => input.props.type !== "checkbox").forEach((input, index) => {
      input.props.onChange({ target: { value: index === 0 ? "current-example" : index === 3 ? "123456" : "new-example-password" } });
    });
  });
  try {
    await act(async () => { view = create(render()); });
    assert.equal(view.root.findAllByType("form").length, 0);
    assert.equal(view.root.findAllByType("input").length, 0);
    await press("Change password"); await fill();
    await act(async () => closeButton().props.onClick());
    assert.equal(view.root.findAllByType("form").length, 0);
    await press("Change password");
    assert.ok(view.root.findAllByType("input").filter(input => input.props.type !== "checkbox").every(input => input.props.value === ""));
    await fill();
    profile = { ...profile, id: "b", email: "blair@example.invalid" };
    await act(async () => view.update(render("b", "workspace-b")));
    assert.equal(signals[0].aborted, true);
    assert.doesNotMatch(JSON.stringify(view.toJSON()), /alex@example/);
    assert.ok(view.root.findAllByType("input").filter(input => input.props.type !== "checkbox").every(input => input.props.value === ""));
    await fill();
    await act(async () => view.root.findByType("form").props.onSubmit({ preventDefault() {} }));
    assert.equal(writes, 1);
    assert.equal(closeButton().props.disabled, true);
    await act(async () => closeButton().props.onClick());
    assert.equal(view.root.findAllByType("form").length, 1);
    await act(async () => { settle(); });
    assert.equal(view.root.findAllByType("form").length, 0);
    assert.equal(location.hash, "");
  } finally {
    await act(async () => view?.unmount()); globalThis.fetch = previousFetch;
    if (previous) Object.defineProperty(globalThis, "window", previous); else Reflect.deleteProperty(globalThis, "window");
  }
});
