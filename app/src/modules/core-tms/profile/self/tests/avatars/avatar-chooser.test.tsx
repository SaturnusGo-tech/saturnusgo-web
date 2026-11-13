import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { installSecurityControls } from "../../../../company-administration/tests/support/security-controls";
import { avatarCharacters } from "../../../avatars/content/avatar-characters";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const restore = installSecurityControls();
const { AvatarChooser } = require("../../presentation/avatar/AvatarChooser") as typeof import("../../presentation/avatar/AvatarChooser");
restore();

test("chooser presents all twenty named portraits and applies only the selected character", async () => {
  let view!: ReactTestRenderer, closed = 0;
  const saved: string[] = [];
  const props = { currentCharacterId: "mika", hasPhoto: false, pending: false, ru: false,
    onSave: async (id: string) => { saved.push(id); return true; }, onUpload: async () => true, onClose: () => { closed++; } };
  await act(async () => { view = create(<AvatarChooser {...props} />); });
  const radios = view.root.findAllByType("input").filter(node => node.props.type === "radio");
  assert.equal(radios.length, 20); assert.equal(new Set(radios.map(node => node.props.value)).size, 20);
  assert.equal(view.root.findAllByType("img").length, 20);
  assert.equal(view.root.findAllByType("button").find(node => node.children.includes("Save"))?.props.disabled, true);
  await act(async () => radios.find(node => node.props.value === "nora")!.props.onChange());
  assert.deepEqual(saved, []); assert.match(JSON.stringify(view.toJSON()), /Nora selected/);
  await act(async () => view.root.findAllByType("button").find(node => node.children.includes("Save"))!.props.onClick());
  assert.deepEqual(saved, ["nora"]); assert.equal(closed, 1);
  await act(async () => view.unmount());
});

test("Russian chooser labels uploads clearly and cancelling changes never applies the draft", async () => {
  let view!: ReactTestRenderer, closed = 0, saved = 0;
  await act(async () => { view = create(<AvatarChooser currentCharacterId="ray" hasPhoto={false} pending={false} ru
    onSave={async () => { saved++; return true; }} onUpload={async () => false} onClose={() => { closed++; }} />); });
  await act(async () => view.root.findAllByType("input").find(node => node.props.value === "mika")!.props.onChange());
  const text = JSON.stringify(view.toJSON());
  for (const character of avatarCharacters) assert.ok(text.includes(character.nameRu));
  assert.match(text, /Выберите аватар/); assert.match(text, /Добавить своё фото/);
  await act(async () => view.root.findAllByType("button").find(node => node.props["aria-label"] === "Закрыть")!.props.onClick());
  assert.equal(closed, 1); assert.equal(saved, 0);
  await act(async () => view.unmount());
});
