import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { renderToStaticMarkup } from "react-dom/server";
import { AdministrationError } from "../../../company-administration/domain/administration";
import { useCompanyCodexAdmin } from "../../application/admin/useCompanyCodexAdmin";
import type { CompanyCodexAdminPort, CompanyCodexConnection } from "../../domain/admin/company-codex-admin";
import { status } from "../support/employee-fixture";
import type { useCodexEmployee } from "../../application/state/useCodexEmployee";
Object.assign(globalThis, { React });
require.extensions[".css"] = module => { module.exports = {}; };
const { CompanyCodexAdminFeature } = require("../../composition/admin/CompanyCodexAdminFeature") as typeof import("../../composition/admin/CompanyCodexAdminFeature");
const { CompanyCodexConnectionRow } = require("../../presentation/company-admin/connections/CompanyCodexConnectionRow") as typeof import("../../presentation/company-admin/connections/CompanyCodexConnectionRow");
const connection: CompanyCodexConnection = { id: "grant-secret-id", person: { id: "person-id", name: "Sofia García" }, projects: [{ id: "project-secret-id", name: "Umbrella Web" }, { id: "gone", name: null }], scopes: ["falcon:read", "falcon:cases:write"], status: "active", createdAt: "2026-11-01T00:00:00Z", expiresAt: "2026-11-08T00:00:00Z", revokedAt: null };

test("company admin screen blocks other roles and server-denied rights without loading grants", () => {
  const state = { employee: { ...status, etag: '"3"', canManage: false }, connections: [], loading: false, pending: false, error: null, connectionsError: null, refresh() {}, deactivate: async () => {}, revoke: async () => {} } satisfies ReturnType<typeof useCodexEmployee>;
  const props = { http: {} as never, status: state, locale: "en" as const, allowed: false, onChanged() {} };
  assert.match(renderToStaticMarkup(<CompanyCodexAdminFeature {...props} />), /company administrators/);
  assert.match(renderToStaticMarkup(<CompanyCodexAdminFeature {...props} allowed />), /do not have permission/);
});

test("connection details present human names and permission labels without raw identifiers", async () => {
  let view!: ReactTestRenderer;
  await act(async () => { view = create(<CompanyCodexConnectionRow connection={connection} ru={false} disabled={false} onRevoke={() => {}} />); });
  const html = JSON.stringify(view.toJSON());
  assert.match(html, /Sofia García/); assert.match(html, /Umbrella Web/); assert.match(html, /Project unavailable/);
  assert.match(html, /Read project data/); assert.match(html, /Edit test cases/);
  assert.doesNotMatch(html, /grant-secret-id|project-secret-id|person-id|falcon:read|falcon:cases:write/);
  assert.match(html, /Revoke access/);
  await act(async () => view.update(<CompanyCodexConnectionRow connection={{ ...connection, status: "revoked" }} ru={false} disabled={false} onRevoke={() => {}} />));
  assert.doesNotMatch(JSON.stringify(view.toJSON()), /Revoke access/);
  await act(async () => view.unmount());
});

test("admin commands require confirmation, retry the same key, refresh truth and paginate bounded grants", async () => {
  const calls: { filter: string; cursor: string | null }[] = [], mutations: string[] = [];
  let failures = 1, changed = 0;
  const api: CompanyCodexAdminPort = {
    async connections(filter, cursor) { calls.push({ filter, cursor }); return { items: [{ ...connection, id: cursor ? "second" : connection.id }], nextCursor: cursor ? null : "next" }; },
    async activate() {}, async deactivate() {},
    async revoke(id, key) { mutations.push(`${id}:${key}`); if (failures--) throw new AdministrationError("SERVICE_UNAVAILABLE"); },
  };
  let current!: ReturnType<typeof useCompanyCodexAdmin>, view!: ReactTestRenderer;
  function Probe() { current = useCompanyCodexAdmin(api, { ...status, etag: '"3"' }, () => { changed++; }); return null; }
  const settle = () => new Promise(resolve => setTimeout(resolve, 10));
  try {
    await act(async () => { view = create(<Probe />); await settle(); });
    await act(async () => { await settle(); });
    assert.equal(current.list.items[0].person.name, "Sofia García");
    await act(async () => { current.choose({ kind: "revoke", id: connection.id, name: connection.person.name }); });
    assert.equal(mutations.length, 0);
    await act(async () => { await current.confirm(); });
    assert.equal(current.error, "SERVICE_UNAVAILABLE"); assert.ok(current.action); assert.equal(changed, 0);
    await act(async () => { await current.confirm(); await settle(); });
    assert.equal(mutations[0], mutations[1]); assert.equal(current.action, null); assert.equal(current.saved, true); assert.equal(changed, 1);
    await act(async () => { await settle(); });
    await act(async () => { await current.list.more(); });
    assert.equal(current.list.items.length, 2); assert.deepEqual(calls[calls.length - 1], { filter: "all", cursor: "next" });
    await act(async () => current.setFilter("revoked"));
    await act(async () => { await settle(); });
    assert.deepEqual(calls[calls.length - 1], { filter: "revoked", cursor: null }); assert.equal(current.list.items.length, 1);
  } finally { await act(async () => view?.unmount()); }
});
