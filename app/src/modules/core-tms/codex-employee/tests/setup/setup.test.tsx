import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { status } from "../support/employee-fixture";
import type { useCodexEmployee } from "../../application/state/useCodexEmployee";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
Object.defineProperty(globalThis, "window", { value: { location: { href: "https://company.test/?view=hooks" } }, configurable: true });
const previous = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { CodexDetail } = require("../../presentation/setup/CodexDetail") as typeof import("../../presentation/setup/CodexDetail");
if (previous) require.extensions[".css"] = previous; else delete require.extensions[".css"];
const state = { employee: { ...status, etag: '"3"' }, connections: [], loading: false, pending: false, error: null, connectionsError: null, refresh: () => {}, deactivate: async () => {}, revoke: async () => {} } satisfies ReturnType<typeof useCodexEmployee>;
test("setup uses tenant URL, explicit scopes and in-page links", () => {
  const view = create(<CodexDetail state={state} locale="en" onBack={() => {}} />);
  const text = JSON.stringify(view.toJSON());
  assert.match(text, /https:\/\/company.test\/api\/v1\/mcp/);
  assert.match(text, /codex mcp login falcon-company_2etest --scopes falcon:read,offline_access/);
  assert.match(text, /#codex-setup/);
  assert.doesNotMatch(text, /chatgpt.com\/plugins/);
});
test("copy feedback reports clipboard success and failure", async () => {
  Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: async () => {} } }, configurable: true });
  const view = create(<CodexDetail state={state} locale="en" onBack={() => {}} />);
  const button = view.root.findAllByType("button").find(node => node.children.includes("Copy"))!;
  await act(async () => { button.props.onClick(); });
  assert.match(JSON.stringify(view.toJSON()), /Copied\./);
  Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: async () => { throw new Error("denied"); } } }, configurable: true });
  await act(async () => { button.props.onClick(); });
  assert.match(JSON.stringify(view.toJSON()), /Copy failed/);
  delete (globalThis as { navigator?: unknown }).navigator;
});
test("unavailable, quota and loading states remain honest", () => {
  const full = { ...state, employee: { ...state.employee, status: "not_activated" as const, canConnect: false, canActivate: false, canDeactivate: false } };
  const view = create(<CodexDetail state={full} locale="en" onBack={() => {}} />);
  const text = JSON.stringify(view.toJSON());
  assert.match(text, /quota is full/);
  assert.match(text, /Company Codex is not active yet/);
  assert.doesNotMatch(text, /Disable for company/);
  const loading = create(<CodexDetail state={{ ...state, employee: null, loading: true }} locale="ru" onBack={() => {}} />);
  assert.match(JSON.stringify(loading.toJSON()), /Загрузка Codex/);
});

test("company names differ, edits drive both snippets, and unsafe names cannot be copied", async () => {
  const writes: string[] = [];
  Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText: async (value: string) => { writes.push(value); } } }, configurable: true });
  const first = create(<CodexDetail state={state} locale="en" onBack={() => {}} />);
  const other = { ...state, employee: { ...state.employee, setup: { ...state.employee.setup, mcpUrl: "https://other.test/api/v1/mcp" } } };
  const second = create(<CodexDetail state={other} locale="en" onBack={() => {}} />);
  const input = first.root.findByProps({ id: "codex-server-name" });
  assert.notEqual(input.props.value, second.root.findByProps({ id: "codex-server-name" }).props.value);
  act(() => input.props.onChange({ target: { value: "team_alpha-2" } }));
  assert.match(JSON.stringify(first.toJSON()), /mcp_servers.team_alpha-2/);
  assert.match(JSON.stringify(first.toJSON()), /login team_alpha-2 --scopes/);
  const buttons = first.root.findAllByType("button");
  await act(async () => { buttons.find(button => button.children.includes("Copy TOML"))!.props.onClick(); buttons.find(button => button.children.includes("Copy command"))!.props.onClick(); });
  assert.match(writes[0], /mcp_servers.team_alpha-2/); assert.match(writes[1], /login team_alpha-2/);
  for (const value of ["", "bad name", "bad;command", "-bad"]) {
    act(() => input.props.onChange({ target: { value } }));
    assert.equal(first.root.findByProps({ id: "codex-server-name" }).props["aria-invalid"], true);
    assert.equal(buttons.find(button => button.children.includes("Copy TOML"))!.props.disabled, true);
    assert.equal(buttons.find(button => button.children.includes("Copy command"))!.props.disabled, true);
  }
});
test("denied status offers retry without asserting a specific cause", () => {
  let retries = 0;
  const view = create(<CodexDetail state={{ ...state, employee: null, error: "FORBIDDEN", refresh: () => { retries++; } }} locale="en" onBack={() => {}} />);
  assert.match(JSON.stringify(view.toJSON()), /company feature or your account permissions may be the cause/);
  const retry = view.root.findAllByType("button").find(button => button.children.includes("Retry"))!;
  act(() => retry.props.onClick()); assert.equal(retries, 1);
});

test("pending tester, full quota manager and active viewer receive qualified guidance", () => {
  const scenarios = [
    { status: "not_activated" as const, occupied: 2, limit: 5 },
    { status: "not_activated" as const, occupied: 5, limit: 5 },
    { status: "active" as const, occupied: 2, limit: 5 },
  ];
  for (const row of scenarios) {
    const employee = { ...state.employee, status: row.status, capacity: { occupied: row.occupied, limit: row.limit }, canConnect: false, canActivate: false, canDeactivate: false };
    const view = create(<CodexDetail state={{ ...state, employee }} locale="en" onBack={() => {}} />);
    const text = JSON.stringify(view.toJSON());
    assert.match(text, row.status === "active" ? /unavailable for this account/ : /Company Codex is not active yet/);
    assert.doesNotMatch(text, /QA rights are required/);
    assert.doesNotMatch(text, /Disable for company/);
    if (row.occupied === row.limit) assert.match(text, /seat quota is full/);
  }
});
