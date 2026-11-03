import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import { analysis, scope } from "../fixtures/impact-fixture";

const require = createRequire(import.meta.url), previousCss = require.extensions[".css"];
const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
let AnalysisDetail: typeof import("../../presentation/detail/AnalysisDetail")["AnalysisDetail"];
before(async () => {
  require.extensions[".css"] = module => { module.exports = {}; };
  Object.assign(globalThis, { React });
  ({ AnalysisDetail } = await import("../../presentation/detail/AnalysisDetail"));
});
after(() => {
  if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
  if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React");
});

test("scope save retains the summary and Add test without showing an unresolved-operation banner", async () => {
  let item = analysis({ scope: ["one", "two"].map(id => ({ testCaseId: id, testCaseKey: id, title: `Case ${id}`, origin: "falcon", included: true })) });
  let release!: () => void, posts = 0;
  const http = createTmsHttpClient({ apiBase: "https://api.falcon.test/api/v1", credentials: "include", fetch: async (_, init) => {
    if (init?.method === "POST") {
      posts++;
      await new Promise<void>(resolve => { release = resolve; });
      item = { ...item, rowVersion: 8, scope: item.scope.map(row => ({ ...row, included: row.testCaseId !== "one" })) };
    }
    return Response.json({ data: item }, { headers: { etag: `v${item.rowVersion}` } });
  } });
  const permissions = { read: true, configure: true, review: true, manageCases: true, audit: false };
  const view: React.JSX.Element = React.createElement(TmsHttpClientProvider, { client: http, children:
    React.createElement(TmsSessionProvider, { value: { kind: "managed", label: "QA", subject: "pending-layout", signOut: async () => {} }, children:
      React.createElement(AnalysisDetail, { scope, id: item.id, ru: false, permissions, onBack() {} }) }) });
  let root!: ReactTestRenderer;
  try {
    await act(async () => { root = create(view); });
    const summary = root.root.findByType("h2");
    const add = () => root.root.findAllByType("button").find(node => node.children.includes("Add test"));
    const inputs = () => root.root.findAllByType("input").filter(node => node.props.type === "checkbox");
    const firstInput = inputs()[0], secondInput = inputs()[1], addButton = add();
    assert.ok(addButton);
    await act(async () => firstInput.props.onChange());
    assert.equal(posts, 1);
    assert.equal(root.root.findByType("h2"), summary);
    assert.equal(add(), addButton);
    assert.ok(inputs().every(node => node.props.disabled !== true));
    assert.ok(inputs().every(node => node.props["aria-disabled"] === true));
    assert.equal(JSON.stringify(root.toJSON()).includes("A previous action has no confirmed result yet"), false);
    await act(async () => secondInput.props.onChange());
    assert.equal(posts, 1);
    await act(async () => release());
    assert.equal(inputs()[0].props.checked, false); assert.equal(inputs()[1].props.checked, true);
    assert.equal(add(), addButton);
  } finally { await act(async () => root?.unmount()); }
});
