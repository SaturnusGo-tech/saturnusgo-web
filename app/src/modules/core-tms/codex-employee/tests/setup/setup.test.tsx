import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { connection, status } from "../support/employee-fixture";
import type { useCodexEmployee } from "../../application/state/useCodexEmployee";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
Object.defineProperty(globalThis, "window", {
  value: Object.assign(new EventTarget(), { location: { href: "https://company.test/?view=config&settings=plugins&plugin=codex" } }),
  configurable: true,
});
const previous = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { CodexPluginManager } = require("../../presentation/plugin-management/CodexPluginManager") as typeof import("../../presentation/plugin-management/CodexPluginManager");
const { CodexPluginPreview } = require("../../presentation/plugin-preview/CodexPluginPreview") as typeof import("../../presentation/plugin-preview/CodexPluginPreview");
if (previous) require.extensions[".css"] = previous; else delete require.extensions[".css"];
const state = { employee: { ...status, etag: '"3"' }, connections: [], loading: false, pending: false, error: null, connectionsError: null, refresh: () => {}, deactivate: async () => {}, revoke: async () => {} } satisfies ReturnType<typeof useCodexEmployee>;
const render = (value: ReturnType<typeof useCodexEmployee> = state, locale: "en" | "ru" = "en") => create(<CodexPluginManager state={value} locale={locale} onBack={() => {}} onViewDetails={() => {}} />);
const openSetup = (view: ReactTestRenderer) => act(() => view.root.findByProps({ "aria-label": "Configure Falcon MCP" }).props.onClick());
const text = (view: ReactTestRenderer) => view.root.findAll(node => typeof node.type === "string")
  .map(node => node.children.filter(child => typeof child === "string").join("")).join(" ");

test("manager setup uses tenant URL, authoritative scopes and three concise OAuth steps", () => {
  const view = render(); openSetup(view);
  assert.match(text(view), /https:\/\/company.test\/api\/v1\/mcp/);
  assert.match(text(view), /codex mcp login falcon-company_2etest --scopes falcon:read,offline_access/);
  assert.doesNotMatch(text(view), /chatgpt.com\/plugins/);
  const lists = view.root.findAllByType("ol"); assert.equal(lists.length, 1); assert.equal(lists[0].findAllByType("li").length, 3);
  assert.equal(view.root.findAllByType("button").filter(button => button.props["aria-label"] === "Refresh").length, 0);
  assert.doesNotMatch(text(view), /billable seat|Occupied seats|Disable for company/);
  assert.ok(view.root.findAllByType("a").some(link => String(link.props.href).includes("codex-web-qa")));
  act(() => view.unmount());
});
test("copy feedback reports clipboard success and failure without losing the configured name", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: async () => {} } }, configurable: true });
  const view = render(); openSetup(view);
  const button = view.root.findByProps({ "aria-label": "Copy server URL" });
  try {
    await act(async () => { await button.props.onClick(); }); assert.match(text(view), /Copied\./);
    assert.equal(button.props.title, "Copied"); assert.equal(button.props["aria-label"], "Copy server URL");
    assert.equal(view.root.findByProps({ "aria-label": "Copy TOML" }).props.title, "Copy TOML");
    Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: async () => { throw new Error("denied"); } } }, configurable: true });
    await act(async () => { await button.props.onClick(); }); assert.match(text(view), /Copy failed/); assert.equal(button.props.title, "Copy server URL");
    assert.equal(view.root.findByProps({ id: "codex-server-name" }).props.value, "falcon-company_2etest");
  } finally { act(() => view.unmount()); if (original) Object.defineProperty(globalThis, "navigator", original); else Reflect.deleteProperty(globalThis, "navigator"); }
});
test("copying a Codex example still works when the native shell denies the Clipboard API", async t => {
  const writeText = async () => { throw new DOMException("Write permission denied", "NotAllowedError"); };
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText } }, configurable: true });
  t.after(() => { if (originalNavigator) Object.defineProperty(globalThis, "navigator", originalNavigator); else Reflect.deleteProperty(globalThis, "navigator"); });
  const view = create(<CodexPluginPreview ru={false} />);
  t.after(() => act(() => view.unmount()));
  let selected = false, removed = false, restoredFocus = false;
  const field = { value: "", readOnly: false, style: {}, focus() {}, select() { selected = true; }, remove() { removed = true; } };
  const activeElement = { focus() { restoredFocus = true; } };
  const doc = { activeElement, getSelection: () => null, createElement: () => field, body: { appendChild() {} },
    execCommand: (command: string) => command === "copy" && selected && !removed };
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", { value: doc, configurable: true });
  t.after(() => { if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument); else Reflect.deleteProperty(globalThis, "document"); });

  await act(async () => { view.root.findAllByType("button")[0].props.onClick(); });

  assert.match(text(view), /Copied\. Paste the task into Codex\./);
  assert.equal(field.value, "Review this website and draft registration test cases. Organize the coverage into Falcon folders.");
  assert.equal(removed && restoredFocus, true);
});
test("manual configuration is initially hidden, can be expanded and retains localized copy actions", () => {
  for (const locale of ["en", "ru"] as const) {
    const view = render(state, locale);
    act(() => view.root.findByProps({ "aria-label": locale === "ru" ? "Настроить Falcon MCP" : "Configure Falcon MCP" }).props.onClick());
    const trigger = view.root.findByProps({ "aria-controls": "codex-manual-configuration" });
    assert.equal(trigger.props["aria-expanded"], false);
    act(() => trigger.props.onClick()); assert.equal(trigger.props["aria-expanded"], true);
    assert.deepEqual(view.root.findAllByType("h3").filter(node => node.children.includes("config.toml") || node.children.includes("CLI")).map(node => node.children[0]), ["config.toml", "CLI"]);
    for (const label of locale === "ru" ? ["Копировать URL сервера", "Копировать TOML", "Копировать команду"] : ["Copy server URL", "Copy TOML", "Copy command"]) {
      const button = view.root.findByProps({ "aria-label": label });
      assert.equal(button.type, "button"); assert.equal(button.props.type, "button"); assert.equal(button.props.title, label);
      assert.equal(button.props.disabled, false); assert.equal(button.children.some(child => typeof child === "string"), false);
    }
    act(() => view.unmount());
  }
});
test("company names differ, edits drive both snippets, and unsafe names cannot be copied", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator"), writes: string[] = [];
  Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: async (value: string) => { writes.push(value); } } }, configurable: true });
  const first = render(), second = render({ ...state, employee: { ...state.employee, setup: { ...state.employee.setup, mcpUrl: "https://other.test/api/v1/mcp" } } });
  openSetup(first); openSetup(second);
  try {
    assert.notEqual(first.root.findByProps({ id: "codex-server-name" }).props.value, second.root.findByProps({ id: "codex-server-name" }).props.value);
    const input = first.root.findByProps({ id: "codex-server-name" }); act(() => input.props.onChange({ target: { value: "team_alpha-2" } }));
    assert.match(text(first), /mcp_servers.team_alpha-2/); assert.match(text(first), /login team_alpha-2 --scopes/);
    await act(async () => { first.root.findByProps({ "aria-label": "Copy TOML" }).props.onClick(); first.root.findByProps({ "aria-label": "Copy command" }).props.onClick(); });
    assert.match(writes[0], /mcp_servers.team_alpha-2/); assert.match(writes[1], /login team_alpha-2/);
    for (const value of ["", "bad name", "bad;command", "-bad"]) {
      act(() => input.props.onChange({ target: { value } }));
      assert.equal(first.root.findByProps({ id: "codex-server-name" }).props["aria-invalid"], true);
      assert.equal(first.root.findByProps({ "aria-label": "Copy TOML" }).props.disabled, true);
      assert.equal(first.root.findByProps({ "aria-label": "Copy command" }).props.disabled, true);
      const count = writes.length;
      act(() => { first.root.findByProps({ "aria-label": "Copy TOML" }).props.onClick(); first.root.findByProps({ "aria-label": "Copy command" }).props.onClick(); });
      assert.equal(writes.length, count);
    }
  } finally { act(() => { first.unmount(); second.unmount(); }); if (original) Object.defineProperty(globalThis, "navigator", original); else Reflect.deleteProperty(globalThis, "navigator"); }
});
test("unavailable company connection gives one short admin instruction without quota controls", () => {
  const view = render({ ...state, employee: { ...state.employee, status: "not_activated", canConnect: false, canActivate: false, canDeactivate: false } });
  assert.match(text(view), /company administrator/); assert.doesNotMatch(text(view), /billable seat|seat quota|Disable for company|Revoke connection/);
  act(() => view.unmount());
});
test("denied status offers retry without asserting a specific cause", () => {
  let retries = 0;
  const view = render({ ...state, employee: null, error: "FORBIDDEN", refresh: () => { retries++; } });
  assert.match(text(view), /company feature or your account permissions may be the cause/);
  act(() => view.root.findAllByType("button").find(button => button.children.includes("Retry"))!.props.onClick()); assert.equal(retries, 1);
  act(() => view.unmount());
});
test("workspace manager never exposes company activation or connection revocation", () => {
  const view = render({ ...state, connections: [connection], employee: { ...state.employee, canActivate: true, canDeactivate: true } });
  assert.doesNotMatch(text(view), /Disable for company|Revoke connection|Expires|Occupied seats|billable seat/);
  act(() => view.unmount());
});
test("closing setup preserves the name draft and marks closed content inert, including Escape", () => {
  const panel = { inert: false };
  const view = create(<CodexPluginManager state={state} locale="en" onBack={() => {}} onViewDetails={() => {}} />, { createNodeMock: node => node.props.id === "codex-connection-setup" ? panel : null });
  openSetup(view); assert.equal(panel.inert, false);
  act(() => view.root.findByProps({ id: "codex-server-name" }).props.onChange({ target: { value: "my_team" } }));
  let stopped = false;
  act(() => view.root.findByProps({ id: "codex-connection-setup" }).props.onKeyDown({ key: "Escape", stopPropagation: () => { stopped = true; } }));
  assert.equal(stopped, true); assert.equal(panel.inert, true);
  openSetup(view); assert.equal(view.root.findByProps({ id: "codex-server-name" }).props.value, "my_team"); assert.equal(panel.inert, false);
  act(() => view.unmount());
});
test("a setup request opens immediately but can be closed without reopening on an unchanged request", () => {
  const props = { state, locale: "en" as const, onBack() {}, onViewDetails() {}, requestSetup: true };
  const view = create(<CodexPluginManager {...props} />);
  const expanded = () => view.root.findByProps({ "aria-label": "Configure Falcon MCP" }).props["aria-expanded"];
  assert.equal(expanded(), true);
  act(() => view.root.findByProps({ "aria-label": "Configure Falcon MCP" }).props.onClick());
  assert.equal(expanded(), false);
  act(() => view.update(<CodexPluginManager {...props} state={{ ...state }} />));
  assert.equal(expanded(), false);
  act(() => view.update(<CodexPluginManager {...props} requestSetup={false} />));
  act(() => view.update(<CodexPluginManager {...props} />));
  assert.equal(expanded(), true); act(() => view.unmount());
});
