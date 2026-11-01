import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { status } from "../support/employee-fixture";
import type { useCodexEmployee } from "../../application/state/useCodexEmployee";
const requireCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { CodexEmployeeRow } = require("../../presentation/directory/CodexEmployeeRow") as typeof import("../../presentation/directory/CodexEmployeeRow");
const { PersonalCodexConnection } = require("../../presentation/personal/PersonalCodexConnection") as typeof import("../../presentation/personal/PersonalCodexConnection");
const { CodexEmployeeManagement } = require("../../presentation/management/CodexEmployeeManagement") as typeof import("../../presentation/management/CodexEmployeeManagement");
if (requireCss)
    require.extensions[".css"] = requireCss;
else
    delete require.extensions[".css"];
const state = { employee: { ...status, etag: '"3"' }, connections: [], loading: false, pending: false, error: null, connectionsError: null, refresh: () => { }, deactivate: async () => { }, revoke: async () => { } } satisfies ReturnType<typeof useCodexEmployee>;
test("typed singleton employee row has official branding and no human email/password/invitation actions", () => {
    const html = renderToStaticMarkup(<CodexEmployeeRow employee={state.employee} locale="en"/>);
    assert.equal((html.match(/data-codex-employee-row/g) ?? []).length, 1);
    assert.match(html, /assets\/integrations\/codex\/codex-light.png/);
    assert.match(html, /1 company seat/);
    assert.doesNotMatch(html, /mailto:|password|invitation|\/avatar|@/i);
});
test("tester personal action uses server connect rights and manager lifecycle uses full quota and disable rights", () => {
    const personal = renderToStaticMarkup(<PersonalCodexConnection state={{ ...state, employee: { ...state.employee, canDeactivate: false } }} locale="en"/>);
    assert.match(personal, /Connect Codex/);
    assert.doesNotMatch(personal, /Disable for company/);
    const management = renderToStaticMarkup(<CodexEmployeeManagement state={state} locale="en"/>);
    assert.match(management, /10 \/ 10/);
    assert.match(management, /Disable for company/);
    const full = renderToStaticMarkup(<CodexEmployeeManagement state={{ ...state, employee: { ...state.employee, status: "inactive", canConnect: false, canDeactivate: false } }} locale="en"/>);
    assert.match(full, /quota is full/);
    assert.doesNotMatch(full, />Activate Codex</);
    assert.match(renderToStaticMarkup(<PersonalCodexConnection state={state} locale="ru"/>), /Подключить Codex/);
});
test("official light/dark asset bytes match verified signed-source provenance", () => {
    for (const [name, hash] of [["codex-light.png", "de7d43f3386105ab20952958c2c25beb0d903e2aeb6e1aef57c49a648c0d1c07"], ["codex-dark.png", "69fb4384e161be8a20dcb94a9ac34aea4fbfaeb67514110a71e7b0732eccb0fc"]]) {
        assert.equal(createHash("sha256").update(readFileSync(`public/assets/integrations/codex/${name}`)).digest("hex"), hash);
    }
});

test("company directory row exposes agent-specific lifecycle in an inline disclosure at every width",()=>{
  const html=renderToStaticMarkup(<CodexEmployeeRow employee={state.employee} locale="en" management={<CodexEmployeeManagement state={state} locale="en"/>}/>);
  assert.match(html,/^<details/);assert.match(html,/<summary[^>]*aria-label="Company Codex"/);
  assert.match(html,/Disable for company/);assert.match(html,/10 \/ 10/);
  assert.doesNotMatch(html,/password|invitation|mailto:/i);
});
