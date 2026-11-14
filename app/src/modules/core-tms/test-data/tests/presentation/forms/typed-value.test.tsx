import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { installRenderControls } from "../../support/render-controls";

const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Value: typeof import("../../../presentation/forms/TypedValue")["TypedValue"];
before(() => {
  Object.assign(globalThis, { React });
  const restore = installRenderControls();
  try { Value = require("../../../presentation/forms/TypedValue").TypedValue; } finally { restore(); }
});
after(() => {
  if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React");
});

test("static values explain the selected format and preserve exact decimal input", async () => {
  let changed = "", view: ReturnType<typeof create>;
  await act(async () => { view = create(<Value type="Decimal" value="" onChange={value => { changed = value; }} ru={false} />); });
  const decimal = view!.root.findByType("input");
  assert.equal(decimal.props.label, "Decimal value");
  assert.equal(decimal.props.inputMode, "decimal");
  assert.equal(decimal.props.type, "text", "currency input must not coerce exact decimal strings through binary numbers");
  assert.match(decimal.props.description, /decimal point/i);
  await act(async () => decimal.props.onValueChange("999999999999999999.01"));
  assert.equal(changed, "999999999999999999.01");
  await act(async () => view!.update(<Value type="URL" value="" onChange={() => {}} ru={false} />));
  const url = view!.root.findByType("input");
  assert.equal(url.props.label, "URL");
  assert.equal(url.props.type, "url");
  assert.match(url.props.description, /https:\/\//);
  await act(async () => view!.unmount());
});

test("date and date-time values have explicit formats; protected fields never render guidance with a value", async () => {
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<Value type="Date" value="" onChange={() => {}} ru />); });
  assert.equal(view!.root.findByType("input").props.label, "Дата");
  assert.match(view!.root.findByType("input").props.description, /ГГГГ-ММ-ДД/);
  await act(async () => view!.update(<Value type="DateTime" value="" onChange={() => {}} ru={false} />));
  assert.match(view!.root.findByType("input").props.description, /time zone/i);
  await act(async () => view!.update(<Value type="String" value="never-persist" onChange={() => {}} secret ru={false} />));
  const secret = view!.root.findByType("input");
  assert.equal(secret.props.type, "password");
  assert.equal(secret.props.autoComplete, "off");
  assert.equal(secret.props.description, undefined);
  await act(async () => view!.unmount());
});
