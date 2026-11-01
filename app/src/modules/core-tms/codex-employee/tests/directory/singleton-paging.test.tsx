import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import type { AdministrationPort } from "../../../company-administration/application/ports/administration-port";
import type { SignedInCompanySession } from "../../../auth/managed/domain/managed-access";
import { status } from "../support/employee-fixture";
(globalThis as typeof globalThis & {
    React: typeof React;
}).React = React;
require.extensions[".css"] = module => { module.exports = {}; };
const { MemberList } = require("../../../company-administration/presentation/members/MemberList") as typeof import("../../../company-administration/presentation/members/MemberList");
const { CodexEmployeeManagement } = require("../../presentation/management/CodexEmployeeManagement") as typeof import("../../presentation/management/CodexEmployeeManagement");
const { CodexEmployeeRow } = require("../../presentation/directory/CodexEmployeeRow") as typeof import("../../presentation/directory/CodexEmployeeRow");
test("agent singleton stays one through human paging/search and never enters human actions", async () => {
    const old = { window: globalThis.window, document: globalThis.document, raf: globalThis.requestAnimationFrame, caf: globalThis.cancelAnimationFrame };
    Object.assign(globalThis, { window: { matchMedia: () => ({ matches: false, addEventListener() { }, removeEventListener() { } }) }, document: { addEventListener() { }, removeEventListener() { } }, requestAnimationFrame: (fn: () => void) => { fn(); return 1; }, cancelAnimationFrame: () => { } });
    const requests: string[] = [];
    const actions: string[] = [];
    const member = (name: string) => ({ identityId: name, name, email: `${name}@example.test`, role: "tester", status: "active", version: 1, owner: false, hasAvatar: false });
    const client = { members: async (search: string, cursor: string | null) => { requests.push(`${search}:${cursor ?? ""}`); return { items: [member(search || cursor || "first")], nextCursor: cursor ? null : "next" }; } } as unknown as AdministrationPort;
    const employeeState = {employee:{...status,etag:'"3"'},connections:[],loading:false,pending:false,error:null,connectionsError:null,refresh:()=>{},deactivate:async()=>{},revoke:async()=>{}};
    const session = { identity: { id: "manager", role: "workspace_admin", owner: true } } as unknown as SignedInCompanySession;
    let view!: ReactTestRenderer;
    try {
        await act(async () => { view = create(<TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale: () => { }, t: key => key }}><MemberList employeeRow={<CodexEmployeeRow employee={{ ...status, etag: '"3"' }} locale="en" management={<CodexEmployeeManagement state={employeeState} locale="en"/>}/>} client={client} session={session} selectedId={null} creating={false} version={0} disabled={false} onCreate={() => { }} onOpen={id => actions.push(id)} onAction={id => actions.push(id)}/></TmsLocaleContext.Provider>); });
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
        const singleton = () => view.root.findAll(node => node.props["data-codex-employee-row"] !== undefined).length;
        assert.equal(singleton(), 1);
        assert.equal(view.root.findAll(node=>node.props["data-codex-employee-entry"]!==undefined).length,1);
        assert.equal(view.root.findAllByType(CodexEmployeeManagement).length,1);
        const more = view.root.findAllByType("button").find(node => node.children.includes("Load more"));
        assert.ok(more);
        await act(async () => { await more.props.onClick(); });
        assert.equal(singleton(), 1);
        assert.equal(requests.length, 2);
        const search = view.root.findByType("input");
        await act(async () => search.props.onChange({ target: { value: "Ada" } }));
        await act(async () => { await new Promise(resolve => setTimeout(resolve, 230)); });
        assert.equal(singleton(), 1);
        assert.ok(requests.includes("Ada:"));
        assert.equal(actions.includes("agent"), false);
        await act(async () => view.unmount());
    }
    finally {
        Object.assign(globalThis, { window: old.window, document: old.document, requestAnimationFrame: old.raf, cancelAnimationFrame: old.caf });
    }
});
