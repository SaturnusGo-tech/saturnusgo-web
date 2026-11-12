import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import type { KlipyAppearance } from "../../model/klipy-types";
const require = createRequire(import.meta.url), oldCss = require.extensions[".css"], oldReact = Object.getOwnPropertyDescriptor(globalThis, "React");
let Gallery: typeof import("../../presentation/KlipyGallery")["KlipyGallery"];
before(async () => { require.extensions[".css"] = module => { module.exports = {}; }; Object.assign(globalThis, { React });
  ({ KlipyGallery: Gallery } = await import("../../presentation/KlipyGallery")); });
after(() => { if (oldCss) require.extensions[".css"] = oldCss; else delete require.extensions[".css"];
  if (oldReact) Object.defineProperty(globalThis, "React", oldReact); else Reflect.deleteProperty(globalThis, "React"); });

test("missing configuration is honest, attributed and makes no provider requests", async t => {
  let calls = 0; t.mock.method(globalThis, "fetch", async () => { calls++; throw new Error("Unexpected request"); });
  let view!: ReturnType<typeof create>; await act(async () => { view = create(<Gallery apiKey="" ru={false} onChoose={() => {}} />); });
  t.after(() => act(() => view.unmount()));
  assert.match(JSON.stringify(view.toJSON()), /GIF gallery is not available yet/); assert.equal(calls, 0);
  assert.equal(view.root.findByProps({ "aria-label": "Search GIFs on KLIPY" }).props.disabled, true);
  assert.equal(view.root.findByProps({ type: "search" }).props.placeholder, "Search KLIPY");
  assert.equal(view.root.findByProps({ href: "https://klipy.com" }).children.includes("Powered by KLIPY"), true);
});

test("selected GIF emits the generated appearance, retains source attribution and reports selection directly", async t => {
  const urls: URL[] = [], choices: KlipyAppearance[] = [];
  const delivery = "https://static.klipy.com/actual.gif?delivery=preserved";
  t.mock.method(globalThis, "fetch", async (input: URL) => { const url = new URL(input); urls.push(url);
    return Response.json(url.pathname.endsWith("registershare") ? { result: true } : { results: [{ id: "123", title: "Wave", content_description: "A friendly wave",
      content_description_source: "Artist", itemurl: "https://klipy.com/gifs/wave", media_formats: { tinygif: { url: delivery } } }], next: "" }); });
  let view!: ReturnType<typeof create>; await act(async () => { view = create(<Gallery apiKey="key" ru={false} onChoose={value => choices.push(value)} />); });
  t.after(() => act(() => view.unmount()));
  assert.equal(view.root.findByProps({ href: "https://klipy.com/gifs/wave" }).children.includes("Source"), true);
  assert.match(JSON.stringify(view.toJSON()), /Artist/);
  await act(async () => view.root.findByProps({ "aria-label": "Use GIF: A friendly wave" }).props.onClick());
  assert.deepEqual(choices, [{ kind: "gif", provider: "klipy", id: "123", url: delivery, sourceUrl: "https://klipy.com/gifs/wave" }]);
  assert.equal(urls[1].origin, "https://api.klipy.com"); assert.equal(urls[1].pathname, "/v2/registershare");
});

test("the always-present search shell sends typed queries to KLIPY after debounce", async t => {
  const urls: URL[] = [];
  t.mock.method(globalThis, "fetch", async (input: URL) => { urls.push(new URL(input)); return Response.json({ results: [], next: "" }); });
  let view!: ReturnType<typeof create>; await act(async () => { view = create(<Gallery apiKey="key" ru onChoose={() => {}} />); });
  t.after(() => act(() => view.unmount()));
  const search = view.root.findByProps({ type: "search" });
  assert.equal(search.parent?.props["data-input-shell"], true, "search uses the shared field shell, visible without another toggle");
  assert.equal(search.props.disabled, false); assert.equal(search.props.hidden, undefined);
  assert.equal(search.props.placeholder, "Search KLIPY");
  assert.equal(search.props["aria-label"], "Поиск GIF в KLIPY");
  assert.equal(view.root.findAllByProps({ "aria-label": "Очистить поиск GIF" }).length, 0);
  await act(async () => search.props.onChange({ target: { value: "happy" } }));
  assert.equal(urls.length, 1, "typing does not bypass the debounce");
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 330)); });
  assert.equal(urls.length, 2); assert.equal(urls[1].pathname, "/v2/search");
  assert.equal(urls[1].searchParams.get("q"), "happy"); assert.equal(urls[1].searchParams.get("limit"), "12");
  await act(async () => view.root.findByProps({ "aria-label": "Очистить поиск GIF" }).props.onClick());
  assert.equal(view.root.findByProps({ type: "search" }).props.value, "");
  assert.equal(view.root.findAllByProps({ "aria-label": "Очистить поиск GIF" }).length, 0);
  assert.equal(urls.length, 3); assert.equal(urls[2].pathname, "/v2/featured"); assert.equal(urls[2].searchParams.has("q"), false);
});

test("failed selection reporting keeps the chosen GIF and produces no gallery failure", async t => {
  const choices: KlipyAppearance[] = [];
  t.mock.method(globalThis, "fetch", async (input: URL) => {
    if (new URL(input).pathname === "/v2/registershare") throw new Error("Provider unavailable");
    return Response.json({ results: [{ id: "selected", media_formats: { tinygif: { url: "https://static.klipy.com/selected.gif" } } }], next: "" });
  });
  let view!: ReturnType<typeof create>; await act(async () => { view = create(<Gallery apiKey="key" ru={false} onChoose={value => choices.push(value)} />); });
  t.after(() => act(() => view.unmount()));
  await act(async () => view.root.findByProps({ "aria-label": "Use GIF: GIF" }).props.onClick());
  assert.deepEqual(choices, [{ kind: "gif", provider: "klipy", id: "selected", url: "https://static.klipy.com/selected.gif" }]);
  assert.doesNotMatch(JSON.stringify(view.toJSON()), /Could not load GIFs|Provider unavailable/);
});
