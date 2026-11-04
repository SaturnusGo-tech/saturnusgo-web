import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { SelfProfileDetails } from "../../domain/profile-model";
import { profile } from "../helpers/profile-fixtures";

void test("profile editor saves trimmed identity and optional contacts without an authorization role field", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"], previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
  require.extensions[".css"] = module => { module.exports = {}; };
  Object.assign(globalThis, { React });
  t.after(() => { if (css) require.extensions[".css"] = css; else delete require.extensions[".css"]; if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React"); });
  const { ProfileEditor } = await import("../../presentation/editor/ProfileEditor");
  const saves: SelfProfileDetails[] = [];
  const onSave = async (details: SelfProfileDetails) => { saves.push(details); return true; };
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<ProfileEditor profile={profile} pending={false} ru={false} onSave={onSave} />); });
  const input = (property: string, value: string) => renderer.root.findAllByType("input").find(node => node.props[property] === value)!;
  const phone = input("type", "tel");
  const browserPhonePattern = new RegExp(`^(?:${phone.props.pattern})$`, "v");
  assert.equal(browserPhonePattern.test("+7 (777) 123-45-67"), true, "formatted saved phone must not block unrelated edits");
  assert.equal(browserPhonePattern.test("020 7946 0958"), true);
  await act(async () => {
    input("autoComplete", "name").props.onChange({ target: { value: "  Pat Updated  " } });
    input("placeholder", "https://").props.onChange({ target: { value: "  mailto:qa@example.test " } });
  });
  await act(async () => renderer.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.equal(saves[0].name, "Pat Updated");
  assert.equal(saves[0].contactUrl, "mailto:qa@example.test");
  assert.equal("role" in saves[0], false);
  await act(async () => input("placeholder", "https://").props.onChange({ target: { value: "  " } }));
  await act(async () => renderer.root.findByType("form").props.onSubmit({ preventDefault() {} }));
  assert.equal(saves[1].contactUrl, null, "blank contact intentionally clears the saved value");
  await act(async () => renderer.unmount());
});

void test("uploading profile media preserves unsaved text while changing accounts resets the draft", async t => {
  const require = createRequire(import.meta.url), css = require.extensions[".css"], previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
  require.extensions[".css"] = module => { module.exports = {}; };
  Object.assign(globalThis, { React });
  t.after(() => { if (css) require.extensions[".css"] = css; else delete require.extensions[".css"]; if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React"); });
  const { ProfileEditor } = await import("../../presentation/editor/ProfileEditor");
  const onSave = async () => true;
  let renderer!: ReactTestRenderer;
  await act(async () => { renderer = create(<ProfileEditor profile={profile} pending={false} ru={false} onSave={onSave} />); });
  const name = () => renderer.root.findAllByType("input").find(node => node.props.autoComplete === "name")!;
  await act(async () => name().props.onChange({ target: { value: "Unfinished name" } }));
  await act(async () => renderer.update(<ProfileEditor profile={{ ...profile, hasAvatar: true, version: 4 }} pending={false} ru={false} onSave={onSave} />));
  assert.equal(name().props.value, "Unfinished name");
  assert.equal(renderer.root.findByProps({ type: "submit" }).props.disabled, false);
  await act(async () => renderer.update(<ProfileEditor profile={{ ...profile, id: "qa-2", name: "Another QA" }} pending={false} ru={false} onSave={onSave} />));
  assert.equal(name().props.value, "Another QA");
  assert.equal(renderer.root.findByProps({ type: "submit" }).props.disabled, true);
  await act(async () => renderer.unmount());
});
