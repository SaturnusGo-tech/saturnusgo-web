import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../../localization/context/TmsLocaleProvider";
import type { TmsLocaleContextValue } from "../../../../../localization/context/TmsLocaleProvider";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
require.extensions[".css"] = module => { module.exports = {}; };
const { ProductDocCaseReferenceGroup } = require("../ProductDocCaseReferenceGroup") as typeof import("../ProductDocCaseReferenceGroup");

for (const locale of ["en", "ru"] as const) test(`case disclosure keeps original links and exposes the remaining rows accessibly (${locale})`, async () => {
  let opened = "", focused = "", view!: ReactTestRenderer;
  const context = { locale } as TmsLocaleContextValue;
  const links = Array.from({ length: 7 }, (_, index) => <a key={index} href={`#case-${index}`}
    title={`Check ${index}`} onClick={() => { opened = `case-${index}`; }} onFocus={() => { focused = `case-${index}`; }}>Case {index}</a>);
  await act(async () => { view = create(<TmsLocaleContext.Provider value={context}>
    <ProductDocCaseReferenceGroup>{links}</ProductDocCaseReferenceGroup>
  </TmsLocaleContext.Provider>); });
  const button = () => view.root.findByType("button");
  const remaining = () => view.root.findByProps({ id: button().props["aria-controls"] });
  const lists = view.root.findAllByType("ul");
  assert.equal(lists[0].findAllByType("li").length, 3);
  assert.equal(lists[1].findAllByType("li").length, 4);
  assert.equal(remaining().props.hidden, true);
  assert.equal(button().props["aria-expanded"], false);
  assert.match(button().children.join(""), locale === "ru" ? /Ещё 4/ : /Show 4 more/);
  await act(async () => button().props.onClick());
  assert.equal(remaining().props.hidden, false);
  assert.equal(button().props["aria-expanded"], true);
  const link = remaining().findAllByType("a")[1];
  assert.equal(link.props.href, "#case-4");
  assert.equal(link.props.title, "Check 4");
  await act(async () => { link.props.onFocus(); link.props.onClick(); });
  assert.equal(opened, "case-4"); assert.equal(focused, "case-4");
  await act(async () => button().props.onClick());
  assert.equal(remaining().props.hidden, true);
  await act(async () => view.unmount());
});

test("three references need no redundant disclosure", async () => {
  let view!: ReactTestRenderer;
  await act(async () => { view = create(<TmsLocaleContext.Provider value={{ locale: "en" } as TmsLocaleContextValue}>
    <ProductDocCaseReferenceGroup>{[1, 2, 3].map(id => <a key={id} href={`#case-${id}`}>Case {id}</a>)}</ProductDocCaseReferenceGroup>
  </TmsLocaleContext.Provider>); });
  assert.equal(view.root.findAllByType("li").length, 3);
  assert.equal(view.root.findAllByType("button").length, 0);
  await act(async () => view.unmount());
});
