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
test("official light/dark asset bytes match verified signed-source provenance", () => {
    for (const [name, hash] of [["codex-light.png", "de7d43f3386105ab20952958c2c25beb0d903e2aeb6e1aef57c49a648c0d1c07"], ["codex-dark.png", "69fb4384e161be8a20dcb94a9ac34aea4fbfaeb67514110a71e7b0732eccb0fc"]]) {
        assert.equal(createHash("sha256").update(readFileSync(`public/assets/integrations/codex/${name}`)).digest("hex"), hash);
    }
});

test("company directory opens dedicated agent administration without embedded lifecycle controls",()=>{
  const html=renderToStaticMarkup(<CodexEmployeeRow employee={state.employee} locale="en" href="/admin/?page=codex"/>);
  assert.match(html,/^<a/);assert.match(html,/href="\/admin\/\?page=codex"/);
  assert.doesNotMatch(html,/<details|Disable for company|10 \/ 10/);
  assert.doesNotMatch(html,/password|invitation|mailto:/i);
});

test("directory preserves loading/error/retry before any employee exists without inventing an agent row",async()=>{
  let retries=0;
  const pending={...state,employee:null,loading:true,refresh:()=>{retries++;}};
  let loading="";
  assert.doesNotThrow(()=>{loading=renderToStaticMarkup(<CodexEmployeeRow employee={pending.employee} locale="en" loading retry={pending.refresh}/>);});
  assert.match(loading,/Loading Codex/);assert.doesNotMatch(loading,/data-codex-employee-row|Disable for company|Activate Codex/);
  const failed={...pending,loading:false,error:"SERVICE_UNAVAILABLE"};
  const html=renderToStaticMarkup(<CodexEmployeeRow employee={failed.employee} locale="en" error={failed.error} retry={failed.refresh}/>);
  assert.match(html,/Codex could not be loaded/);assert.match(html,/Retry/);assert.doesNotMatch(html,/data-codex-employee-row/);
  const {act,create}=await import("react-test-renderer");
  const mounted:{view?:ReturnType<typeof create>}={};
  await act(async()=>{mounted.view=create(<CodexEmployeeRow employee={failed.employee} locale="en" error={failed.error} retry={failed.refresh}/>);});
  const view=mounted.view;assert.ok(view);
  await act(async()=>view.root.findByType("button").props.onClick());assert.equal(retries,1);
  await act(async()=>view.unmount());
});
