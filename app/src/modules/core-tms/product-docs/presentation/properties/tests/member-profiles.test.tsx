import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test, { type TestContext } from "node:test";
import { runInNewContext } from "node:vm";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import ts from "typescript";
import { memberRoleLabel } from "../../../../company-administration/presentation/permissions/member-role-label";
import { useProductDocResource } from "../../../state/useProductDocResource";

const profileDirectory = new URL("../../../../workspace/members/presentation/profile/", import.meta.url);
const assigneeFile = new URL("../../../../presentation/common/properties/metadata/PropertyAssigneeField.tsx", import.meta.url);
const actor = { identityId: "person", kind: "human", name: "Alex", email: "alex@example.test", role: "qa_manager",
  presence: "online", lastSignedInAt: "2026-11-11T04:00:00.000Z", workspaceName: "Falcon team" };

function fixture() {
  let nextTimer = 0;
  const timers = new Map<number, () => void>();
  const visits:string[]=[];
  const win = Object.assign(new EventTarget(), { innerWidth: 1200, location:{href:"https://falcon.test/work/?workspaceId=workspace&projectId=p"} });
  const doc = Object.assign(new EventTarget(), { getElementById: () => null });
  const Button = ({ children, onPress, isDisabled, ...props }: Record<string, unknown>) =>
    React.createElement("button", { ...props, disabled: isDisabled, onClick: onPress }, children as React.ReactNode);
  function load(url: URL): Record<string, React.ElementType> {
    const module = { exports: {} };
    runInNewContext(ts.transpileModule(readFileSync(url, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, { module, exports: module.exports, window: win, document: doc,
      setTimeout(callback: () => void) { const id = ++nextTimer; timers.set(id, callback); return id; },
      clearTimeout(id: number) { timers.delete(id); },
      require(name: string) {
        if (name === "react") return React;
        if (name === "react/jsx-runtime") return jsx;
        if (name === "@heroui/react") return { Button, Listbox: "ul", ListboxItem: "li" };
        if (name === "@heroui/popover") return { FreeSoloPopover: ({ children }: React.PropsWithChildren) => React.createElement("div", { role: "dialog" }, children) };
        if (name === "lucide-react") return { Bot: "svg", Clock3: "svg", SquareUserRound: "svg", Check: "svg", UserRound: "svg" };
        if (name.endsWith("/MemberProfilePreview")) return load(new URL("MemberProfilePreview.tsx", profileDirectory));
        if (name.endsWith("/MemberProfileContent")) return load(new URL("MemberProfileContent.tsx", profileDirectory));
        if (name.endsWith("useWorkspaceActor")) return { useWorkspaceActor: () => ({ actor, loading: false }) };
        if (name.endsWith("MemberAvatar")) return { MemberAvatar: () => React.createElement("span", { "data-avatar": true }) };
        if (name.endsWith("useWorkspaceMembers")) return { useWorkspaceMembers: () => ({ items: [], loading: false, search: "", setSearch() {} }) };
        if (name.endsWith("PropertySelect")) return {
          PropertyValue: ({ children }: React.PropsWithChildren) => React.createElement("div", null, children),
          PropertyPopover: ({ trigger, onOpenChange, open }: { trigger: React.ReactNode; open: boolean; onOpenChange(value: boolean): void }) =>
            React.createElement("button", { onClick: () => onOpenChange(!open) }, trigger), PropertySearch: () => null,
        };
        if(name.endsWith("member-profile-route"))return {memberProfileUrl:(_href:string,workspace:string,id:string)=>`/work/?workspaceId=${workspace}&view=profile&memberId=${id}`};
        if(name.endsWith("workspace-history"))return {visitWorkspace:(href:string)=>visits.push(href)};
        if(name.endsWith("MemberProfileLink"))return {MemberProfileLink:({children,...props}:React.PropsWithChildren)=>React.createElement("a",props,children)};
        if (name.endsWith("member-role-label")) return { memberRoleLabel };
        if (name.endsWith("FalconTooltip")) return { FalconTooltip: ({ children }: React.PropsWithChildren) => children };
        if (name.endsWith("useFormLeave")) return { useFormLeave: () => ({ reset() {} }) };
        if (name.endsWith("useProductDocResource")) return { useProductDocResource };
        if (name.includes("notifications/inbox/model/presentation")) return { notificationTime: () => "now" };
        if (name.endsWith("ErrorToast")) return { ErrorToast: () => null };
        if (name.endsWith("ReadState")) return { ReadState: () => null };
        if (name.endsWith("LoadingOrb")) return { LoadingOrb: () => null };
        if (name.endsWith(".css")) return { default: {} };
        throw new Error(`Unexpected member profile dependency ${name}`);
      },
    });
    return module.exports;
  }
  async function render(t: TestContext, node: Parameters<typeof create>[0]) {
    let renderer!: ReactTestRenderer;
    t.after(() => act(() => renderer.unmount()));
    await act(async () => { renderer = create(node, { createNodeMock: () => ({ getBoundingClientRect: () => ({ left: 400, right: 420 }) }) }); });
    return renderer;
  }
  return { load, render, visits, tick() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()); } };
}

test("docs assignee previews on hover without nesting a profile button inside the editing trigger", async t => {
  const f = fixture();
  const { PropertyAssigneeField } = f.load(assigneeFile);
  const renderer = await f.render(t, <PropertyAssigneeField workspaceId="workspace" locale="en" profilePreview
    value={{ identityId: "person", displayName: "Alex" }} onChange={() => {}} />);
  const anchor = renderer.root.findAllByType("span").find(node => node.props.onPointerEnter);
  assert.ok(anchor, "the docs opt-in must add the existing profile hover target");
  act(() => { anchor.props.onPointerEnter({ pointerType: "mouse" }); f.tick(); });
  assert.equal(renderer.root.findAllByProps({ role: "dialog" }).length, 1);
  assert.equal(renderer.root.findByType("button").findAllByType("button").length, 1, "editable trigger has no nested button");
  act(() => renderer.root.findByType("button").props.onClick());
  assert.equal(renderer.root.findAllByProps({ role: "dialog" }).length, 0, "opening the assignee picker suppresses its profile preview");
});

test("assignee fields keep their existing behavior unless profile preview is enabled", async t => {
  const f = fixture();
  const { PropertyAssigneeField } = f.load(assigneeFile);
  const renderer = await f.render(t, <PropertyAssigneeField workspaceId="workspace" locale="en"
    value={{ identityId: "person", displayName: "Alex" }} onChange={() => {}} />);
  assert.equal(renderer.root.findAllByType("span").filter(node => node.props.onPointerEnter).length, 0);
});

test("the existing profile card displays a real human role with presence and sign-in", async t => {
  const f = fixture();
  const { MemberProfilePreview } = f.load(new URL("MemberProfilePreview.tsx", profileDirectory));
  const renderer = await f.render(t, <MemberProfilePreview workspaceId="workspace" identityId="person" name="Alex" locale="en"><span>Alex</span></MemberProfilePreview>);
  const anchor=renderer.root.findAllByType("span").find(node=>node.props.onPointerEnter)!;
  act(()=>{anchor.props.onPointerEnter({pointerType:"mouse"});f.tick();});
  const text = JSON.stringify(renderer.toJSON());
  assert.match(text, /QA manager/);
  assert.match(text, /Online/);
  assert.match(text, /Last sign-in/);
  assert.match(text, /Falcon team/);
});

test("a read-only docs assignee opens the complete member profile on click", async t => {
  const f = fixture();
  const { PropertyAssigneeField } = f.load(assigneeFile);
  const renderer = await f.render(t, <PropertyAssigneeField workspaceId="workspace" locale="en" profilePreview
    value={{ identityId: "person", displayName: "Alex" }} />);
  const button = renderer.root.findByType("button");
  assert.match(button.findAllByType("span").flatMap(node => node.children.filter(child => typeof child === "string")).join(""), /Alex/);
  act(() => button.props.onClick());
  assert.deepEqual(f.visits,["/work/?workspaceId=workspace&view=profile&memberId=person"]);
});


test("activity avatars expose the existing accessible profile without hiding its trigger", async t => {
  const f = fixture();
  const { ProductDocActivity } = f.load(new URL("../../activity/ProductDocActivity.tsx", import.meta.url));
  const document = { id: "doc", kind: "page", title: "Draft", parentId: null, draftVersion: 1, publishedVersion: null,
    version: null, sections: [], canEdit: true, canPublish: true,
    activity: { created: { identityId: "person", displayName: "Alex", at: "2026-11-11T04:00:00.000Z" } } };
  const renderer = await f.render(t, <ProductDocActivity api={{}} scope={{ workspaceId: "workspace", projectId: "project" }}
    document={document} locale="en" copy={{}} />);
  const button = renderer.root.findAllByType("button").find(node => node.props["aria-label"] === "Profile: Alex");
  assert.ok(button, "the activity avatar must open the existing member profile");
  assert.equal(button.parent?.parent?.props["aria-hidden"], undefined);
  act(() => button.props.onClick());
  assert.deepEqual(f.visits,["/work/?workspaceId=workspace&view=profile&memberId=person"]);
});
