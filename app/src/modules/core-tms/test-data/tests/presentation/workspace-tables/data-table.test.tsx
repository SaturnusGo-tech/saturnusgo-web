import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Table: typeof import("../../../presentation/workspace-table/DataResultTable")["DataResultTable"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try { Table = require("../../../presentation/workspace-table/DataResultTable").DataResultTable; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === "string" ? child : text(child)).join("");
test("single-page tables hide navigation while retaining their row range", async () => {
  for (const pagination of [undefined, { index: 0, hasNext: false, onChange: () => {} }]) {
    let view: ReturnType<typeof create>;
    await act(async () => { view = create(<Table ru={false} label="Customers" table={{ columns: [{ name: "name", type: "String" }], rows: [{ name: "Alice" }, { name: "Bob" }], truncated: false }} pagination={pagination} />); });
    assert.ok(text(view!.root.findByType("footer")).includes("1–2"));
    assert.equal(view!.root.findAllByType("button").length, 0);
    await act(async () => view!.unmount());
  }
});
test("multi-page tables retain navigation including the last server page", async () => {
  for (const pagination of [undefined, { index: 0, hasNext: true, onChange: () => {} }, { index: 1, hasNext: false, onChange: () => {} }]) {
    let view: ReturnType<typeof create>;
    await act(async () => { view = create(<Table ru={false} label="Customers" table={{ columns: [{ name: "name", type: "String" }], rows: Array.from({ length: 51 }, (_, index) => ({ name: `Customer ${index}` })), truncated: false }} pagination={pagination} />); });
    const buttons = view!.root.findAllByType("button");
    assert.equal(buttons.length, 2);
    assert.equal(Boolean(buttons[0].props.isDisabled), !pagination?.index);
    assert.equal(Boolean(buttons[1].props.isDisabled), pagination ? !pagination.hasNext : false);
    await act(async () => view!.unmount());
  }
});
test("query pages retain exact decimal strings and request the next server page", async () => {
  const pages: number[] = []; let view: ReturnType<typeof create>;
  await act(async () => { view = create(<Table ru={false} label="Customers" table={{ columns: [{ name: "amount", type: "Decimal" }], rows: [{ amount: "12345678901234567890.01" }], truncated: false }}
    pagination={{ index: 1, hasNext: true, onChange: page => pages.push(page), busy: false }} />); });
  assert.ok(text(view!.root).includes("12345678901234567890.01"));
  assert.ok(text(view!.root.findByType("footer")).includes("51–51"), "server page two starts at row 51 without inventing a total count");
  await act(async () => view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Next page")!.props.onPress());
  assert.deepEqual(pages, [2]);
  await act(async () => view!.unmount());
});
test("table search filters visible data without converting null into an empty value", async () => {
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<Table ru={false} label="Customers" table={{ columns: [{ name: "name", type: "String" }, { name: "amount", type: "Decimal" }], rows: [{ name: "Alice", amount: null }, { name: "Bob", amount: "0.00" }], truncated: false }} />); });
  assert.ok(text(view!.root).includes("null")); assert.ok(text(view!.root).includes("0.00"));
  await act(async () => view!.root.findByType("input").props.onValueChange("Alice"));
  assert.ok(text(view!.root).includes("Alice")); assert.equal(text(view!.root).includes("Bob"), false);
  await act(async () => view!.unmount());
});
test("searching a loaded server page reports matches without inventing global row positions", async () => {
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<Table ru={false} label="Customers" table={{ columns: [{ name: "name", type: "String" }],
    rows: [{ name: "Bob" }, { name: "Alice" }, { name: "Nora" }], truncated: false }} pagination={{ index: 1, hasNext: true, onChange: () => {} }} />); });
  const input = view!.root.findByType("input");
  assert.equal(input.props["aria-label"], "Search this page");
  await act(async () => input.props.onValueChange("Alice"));
  assert.equal(view!.root.findAllByType("tbody")[0].findAllByType("tr").length, 1);
  assert.ok(text(view!.root.findByType("footer")).includes("1 of 3 on this page"));
  assert.equal(text(view!.root.findByType("footer")).includes("51–51"), false);
  await act(async () => input.props.onValueChange("missing"));
  assert.ok(text(view!.root.findByType("footer")).includes("0 of 3 on this page"));
  assert.ok(text(view!.root).includes("No matching rows"));
  await act(async () => input.props.onValueChange(""));
  assert.ok(text(view!.root.findByType("footer")).includes("51–53"));
  await act(async () => view!.unmount());
});
