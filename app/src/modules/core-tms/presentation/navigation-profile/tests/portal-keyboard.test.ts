import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react-test-renderer";
import type { NavigationProfile } from "../NavigationProfile";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";
import { popupHarness } from "../../navigation/popup/tests/harness";

for (const open of [false, true]) test(`support portal keyboard events pass the account menu unchanged (account open: ${open})`, async t => {
  const runtime = await popupHarness(t);
  if (open) await act(async () => runtime.state().openKeyboard());
  const h = componentHarness(undefined, { document: { body: {} } });
  const { NavigationProfile: render } = h.load<{ NavigationProfile: typeof NavigationProfile }>(new URL("../NavigationProfile.tsx", import.meta.url), name => {
    if (name === "react-dom") return { createPortal: (value: unknown) => value };
    if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => null };
    if (name.endsWith("useDesktopDownloadsAvailable")) return { useDesktopDownloadsAvailable: () => false };
    if (name.endsWith("useRailPopup")) return { useRailPopup: () => runtime.state() };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
  });
  const menu = () => nodes(h.render(() => render({ collapsed: true, workspaceId: "w", onOpenHelp() {}, onOpenSettings() {} })))
    .find(node => node.props.role === "menu")!;
  const textarea = {}; runtime.doc.activeElement = textarea;
  for (const key of ["ArrowDown", "ArrowUp", "Home", "End", "Escape"]) {
    const event = Object.assign(runtime.key(key), { target: textarea, currentTarget: runtime.panel });
    await act(async () => { invoke(menu(), "onKeyDown", event); });
    assert.equal(event.prevented, false, `${key} must retain the support field's default behavior`);
    assert.equal(event.stopped, false, `${key} must reach the support dialog`);
    assert.equal(runtime.doc.activeElement, textarea);
  }
});

test("an open account menu still handles keyboard navigation from its own actions", async t => {
  const runtime = await popupHarness(t); await act(async () => runtime.state().openKeyboard());
  const h = componentHarness(undefined, { document: { body: {} } });
  const { NavigationProfile: render } = h.load<{ NavigationProfile: typeof NavigationProfile }>(new URL("../NavigationProfile.tsx", import.meta.url), name => {
    if (name === "react-dom") return { createPortal: (value: unknown) => value };
    if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => null };
    if (name.endsWith("useDesktopDownloadsAvailable")) return { useDesktopDownloadsAvailable: () => false };
    if (name.endsWith("useRailPopup")) return { useRailPopup: () => runtime.state() };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
  });
  const menu = nodes(h.render(() => render({ collapsed: true, workspaceId: "w", onOpenHelp() {}, onOpenSettings() {} })))
    .find(node => node.props.role === "menu")!;
  const event = Object.assign(runtime.key("ArrowDown"), { target: runtime.items[0], currentTarget: runtime.panel });
  await act(async () => { invoke(menu, "onKeyDown", event); });
  assert.equal(event.prevented, true); assert.equal(runtime.doc.activeElement, runtime.items[1]);
});

test("pointer-opened support captures the visible avatar as its focus return target", async t => {
  const runtime = await popupHarness(t);
  await act(async () => runtime.state().toggle());
  const h = componentHarness(undefined, { document: { body: {} } });
  const { NavigationProfile: render } = h.load<{ NavigationProfile: typeof NavigationProfile }>(new URL("../NavigationProfile.tsx", import.meta.url), name => {
    if (name === "react-dom") return { createPortal: (value: unknown) => value };
    if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => null };
    if (name.endsWith("useDesktopDownloadsAvailable")) return { useDesktopDownloadsAvailable: () => false };
    if (name.endsWith("useRailPopup")) return { useRailPopup: () => runtime.state() };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
  });
  const support = nodes(h.render(() => render({ collapsed: true, workspaceId: "w", onOpenHelp() {}, onOpenSettings() {} })))
    .find(node => node.props.className === "support")!;
  runtime.doc.activeElement = {};
  await act(async () => { invoke(support, "onClickCapture", { target: { closest: () => ({}) } }); });
  assert.equal(runtime.doc.activeElement, runtime.trigger);
  assert.equal(runtime.state().open, false);
});
