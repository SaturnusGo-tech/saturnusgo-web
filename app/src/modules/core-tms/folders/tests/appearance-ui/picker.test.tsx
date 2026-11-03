import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import type { RepositoryFolder } from "../../model/folder";
import type { useFolderAppearanceEditor } from "../../state/appearance-editor/useFolderAppearanceEditor";
const require = createRequire(import.meta.url), oldCss = require.extensions[".css"], oldReact = Object.getOwnPropertyDescriptor(globalThis, "React");
const globals = ["window", "self"] as const, oldGlobals = globals.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
let Picker: typeof import("../../presentation/appearance/picker/FolderAppearancePicker")["FolderAppearancePicker"];
before(async () => { require.extensions[".css"] = module => { module.exports = {}; }; const events = new EventTarget(); const eventHost = { addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events) }; Object.assign(globalThis, { React, window: eventHost, self: eventHost });
  ({ FolderAppearancePicker: Picker } = await import("../../presentation/appearance/picker/FolderAppearancePicker")); });
after(() => { if (oldCss) require.extensions[".css"] = oldCss; else delete require.extensions[".css"];
  if (oldReact) Object.defineProperty(globalThis, "React", oldReact); else Reflect.deleteProperty(globalThis, "React");
  for (const [key, descriptor] of oldGlobals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); } });

test("folder picker starts with selected default icon, provides three autosave tabs, valid HEX and supported upload", t => {
  const choices: unknown[] = [], uploads: File[] = [];
  const editor = { preview: null, busy: false, failed: false, uploadFailed: false, error: "", uploading: false, canUpload: true,
    choose: (value: unknown) => choices.push(value), image: (file: File) => uploads.push(file), previewColor() {}, retry() {}, retryUpload() {}, cancelUpload() {},
  } as unknown as ReturnType<typeof useFolderAppearanceEditor>;
  let view!: ReturnType<typeof create>; act(() => { view = create(<Picker folder={{ appearance: null } as RepositoryFolder} ru={false} editor={editor} />); });
  t.after(() => act(() => view.unmount()));
  assert.equal(view.root.findAllByProps({ role: "tab" }).length, 3);
  assert.equal(view.root.findByProps({ "aria-label": "Default folder" }).props["aria-pressed"], true);
  act(() => view.root.findByProps({ "aria-label": "star" }).props.onClick());
  assert.deepEqual(choices[0], { kind: "icon", iconId: "star", color: null });
  let hex = view.root.findByProps({ "aria-label": "HEX color" });
  act(() => hex.props.onChange({ target: { value: "bad" } })); hex = view.root.findByProps({ "aria-label": "HEX color" });
  act(() => hex.props.onBlur()); assert.equal(choices.length, 1); assert.equal(hex.props["aria-invalid"], true);
  act(() => hex.props.onChange({ target: { value: "#7D75ED" } })); hex = view.root.findByProps({ "aria-label": "HEX color" });
  act(() => hex.props.onBlur()); assert.deepEqual(choices[1], { kind: "icon", iconId: "folder", color: "#7D75ED" });
  act(() => view.root.findAllByProps({ role: "tab" })[2]!.props.onClick());
  const input = view.root.findByProps({ type: "file" }); assert.match(input.props.accept, /image\/gif/); assert.match(input.props.accept, /\.heic/);
  const file = new File(["gif"], "animated.gif", { type: "image/gif" });
  act(() => input.props.onChange({ target: { files: [file], value: "old" } })); assert.equal(uploads[0], file);
  assert.equal(view.root.findAllByType("button").some(button => button.children.includes("Save")), false);
});


test("compact customization exposes color first, fifty icons in a horizontal three-row grid, and presets last", t => {
  const choices: unknown[] = [];
  const editor = { preview: null, busy: false, failed: false, uploadFailed: false, error: "", uploading: false, canUpload: true,
    choose: (value: unknown) => choices.push(value), image() {}, previewColor() {}, retry() {}, retryUpload() {}, cancelUpload() {},
  } as unknown as ReturnType<typeof useFolderAppearanceEditor>;
  let view!: ReturnType<typeof create>; act(() => { view = create(<Picker folder={{ appearance: null } as RepositoryFolder} ru={false} editor={editor} />); });
  t.after(() => act(() => view.unmount()));
  const sliders = view.root.findAllByType("div").filter(node => node.props.role === "slider");
  assert.equal(sliders.length, 2, "the compact saturation and hue controls are always visible");
  const hue = sliders.find(node => node.props["aria-label"] === "Hue"); assert.ok(hue);
  const color = view.root.findAllByType("div").find(node => typeof node.props.onPointerDownCapture === "function"); assert.ok(color);
  act(() => color.props.onPointerDownCapture());
  act(() => hue.props.onKeyDown({ keyCode: 39, preventDefault() {} }));
  const changed = view.root.findByProps({ "aria-label": "HEX color" }).props.value;
  assert.notEqual(changed, "#5797F6"); assert.equal(choices.length, 0, "dragging previews without writing");
  act(() => { window.dispatchEvent(new Event("pointerup")); });
  assert.deepEqual(choices[0], { kind: "icon", iconId: "folder", color: changed });
  assert.equal(view.root.findAllByType("button").some(button => button.children.includes("Custom color")), false);
  const json = JSON.stringify(view.toJSON()); assert.ok(json.indexOf("HEX color") < json.indexOf("Folder icons"));
  assert.ok(json.indexOf("Folder icons") < json.indexOf("Icon color"));
  const icons = view.root.findByProps({ "aria-label": "Folder icons" });
  const buttons = icons.findAllByType("button"); assert.equal(buttons.length, 50);
  assert.equal(icons.props["data-icon-rows"], 3);
  let focused = -1; const nodes = buttons.map((_button, index) => ({ focus: () => { focused = index; } }));
  for (const [key, expected] of [["ArrowDown", 5], ["ArrowUp", 3], ["ArrowRight", 7], ["ArrowLeft", 1]] as const) {
    icons.props.onKeyDown({ key, target: nodes[4], currentTarget: { querySelectorAll: () => nodes }, preventDefault() {} });
    assert.equal(focused, expected);
  }
  assert.equal(choices.length, 1, "arrow navigation does not save an icon until activation");
});

test("the GIF tab is discoverable in English and Russian and retains the user's own image upload", t => {
  const editor = { preview: null, busy: false, failed: false, uploadFailed: false, error: "", uploading: false, canUpload: true,
    choose() {}, image() {}, previewColor() {}, retry() {}, retryUpload() {}, cancelUpload() {},
  } as unknown as ReturnType<typeof useFolderAppearanceEditor>;
  let view!: ReturnType<typeof create>; act(() => { view = create(<Picker folder={{ appearance: null } as RepositoryFolder} ru={false} editor={editor} />); });
  t.after(() => act(() => view.unmount()));
  const gif = view.root.findAllByProps({ role: "tab" }).find(tab => tab.children.includes("GIF")); assert.ok(gif);
  act(() => gif.props.onClick());
  assert.equal(view.root.findAllByType("a").some(link => link.children.includes("Powered by KLIPY")), true);
  assert.equal(view.root.findAllByProps({ type: "file" }).length, 1);
  act(() => view.update(<Picker folder={{ appearance: null } as RepositoryFolder} ru editor={editor} />));
  assert.equal(view.root.findAllByProps({ role: "tab" }).some(tab => tab.children.includes("GIF")), true);
  assert.equal(view.root.findAllByProps({ type: "search" }).length, 1);
});
