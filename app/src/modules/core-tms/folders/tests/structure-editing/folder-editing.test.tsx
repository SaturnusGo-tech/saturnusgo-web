import assert from "node:assert/strict";
import test from "node:test";
import { act } from "react-test-renderer";
import { fixture, folder } from "../structure/structure-harness";

test("folder name opens inline rename and Enter commits only the trimmed name", async t => {
  const updates: unknown[] = [];
  const f = fixture(t, { update: async (value, patch) => { updates.push({ id: value.id, patch }); return true; } });
  act(() => f.buttons("Rename Auth")[0].props.onClick());
  const input = f.root.root.findByProps({ "aria-label": "New folder name" });
  assert.equal(input.props.value, "Auth");
  assert.equal(f.root.root.findAllByType("form").length, 1, "create and rename forms do not stack");
  act(() => input.props.onChange({ target: { value: "  Access  " } }));
  await f.submit();
  assert.deepEqual(updates, [{ id: "auth", patch: { name: "Access" } }]);
  assert.equal(f.root.root.findAllByProps({ "aria-label": "New folder name" }).length, 0);
  assert.equal(f.root.root.findAllByProps({ role: "dialog" }).length, 0);
});

test("targeted Name and location arrival reveals rename without opening a root draft", t => {
  let handled = 0;
  const f = fixture(t, {}, false, { focusFolderId: "auth", onFocusHandled: () => { handled++; } });
  assert.equal(f.root.root.findByProps({ "aria-label": "New folder name" }).props.value, "Auth");
  assert.equal(f.root.root.findAllByProps({ "aria-label": "Folder name" }).length, 0);
  assert.equal(handled, 1);
  act(() => f.root.root.findByType("form").props.onKeyDown({ key: "Escape", preventDefault() {}, stopPropagation() {} }));
  assert.equal(f.root.root.findAllByType("form").length, 0);
});

test("failed rename preserves the draft and pending rename blocks competing changes", async t => {
  let resolve!: (ok: boolean) => void;
  const f = fixture(t, { update: () => new Promise(done => { resolve = done; }) });
  act(() => f.buttons("Rename Auth")[0].props.onClick());
  act(() => f.root.root.findByProps({ "aria-label": "New folder name" }).props.onChange({ target: { value: "Retry name" } }));
  let completion!: Promise<void>;
  act(() => { completion = f.root.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
  assert.equal(f.buttons("New folder")[0].props.disabled, true);
  assert.equal(f.buttons("Back to repository")[0].props.disabled, true);
  await act(async () => { resolve(false); await completion; });
  assert.equal(f.root.root.findByProps({ "aria-label": "New folder name" }).props.value, "Retry name");
  assert.ok(f.root.root.findAllByProps({ role: "alert" }).length);
});

function select(f: ReturnType<typeof fixture>, path: string) {
  act(() => f.root.root.findAllByType("input").find(input => input.props["aria-label"] === `Select folder ${path}`)!.props.onChange());
}
function clickText(f: ReturnType<typeof fixture>, text: string) {
  const button = f.root.root.findAllByType("button").find(node => node.children.some(child => child === text));
  assert.ok(button, `button ${text} exists`); act(() => button.props.onClick());
}

test("bulk move prunes nested selections, keeps failures selected and retries only them", async t => {
  const updates: string[] = [];
  const f = fixture(t, { items: [folder("api", "API"), folder("auth", "Auth", "api", "/API/Auth"), folder("web", "Web"), folder("target", "Target")],
    update: async value => { updates.push(value.id); return value.id !== "web" || updates.filter(id => id === "web").length > 1; } });
  clickText(f, "Select"); select(f, "/API"); select(f, "/API/Auth"); select(f, "/Web"); clickText(f, "Move");
  assert.equal(f.root.root.findAllByProps({ role: "dialog" }).length, 0);
  act(() => f.buttons("Move to /Target")[0].props.onClick());
  await act(async () => { const button = f.root.root.findAllByType("button").find(node => node.children.includes("Move folders")); await button!.props.onClick(); });
  await act(async () => {});
  assert.deepEqual(updates, ["api", "web"]);
  assert.equal(f.root.root.findAllByType("input").find(input => input.props["aria-label"] === "Select folder /Web")!.props.checked, true);
  assert.equal(f.root.root.findAllByType("input").find(input => input.props["aria-label"] === "Select folder /API")!.props.checked, false);
  await act(async () => { const button = f.root.root.findAllByType("button").find(node => node.children.includes("Move folders")); await button!.props.onClick(); });
  await act(async () => {});
  assert.deepEqual(updates, ["api", "web", "web"]);
  assert.equal(f.root.root.findAllByProps({ "aria-label": "Move folders" }).length, 0);
});

test("read-only folder names cannot start renaming or moving", t => {
  const f = fixture(t, { canManage: false });
  assert.equal(f.buttons("Rename Auth")[0].props.disabled, true);
  act(() => f.buttons("Rename Auth")[0].props.onClick());
  assert.equal(f.root.root.findAllByProps({ "aria-label": "New folder name" }).length, 0);
  assert.equal(f.root.root.findAllByType("input").filter(input => input.props.type === "checkbox").length, 0);
});
