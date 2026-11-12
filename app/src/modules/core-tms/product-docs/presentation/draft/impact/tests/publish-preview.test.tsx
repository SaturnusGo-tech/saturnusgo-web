import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import ts from "typescript";
import type { ProductDocsApi } from "../../../../domain/product-docs";
import { productDocErrorCode } from "../../../../domain/errors/product-doc-response";
import { useProductDocResource } from "../../../../state/useProductDocResource";

const scope = { workspaceId: "w", projectId: "p" };
const impact = { publishedVersion: 1, draftVersion: 2, totalLinkedCases: 0, casesNeedingUpdate: 0, affectedCases: 0, cases: [], nextCursor: null,
  changes: { pageChanged: false, orderChanged: false, sections: [] } };
const heroui = Object.fromEntries(["Button", "Modal", "ModalBody", "ModalContent", "ModalFooter", "ModalHeader", "Accordion", "AccordionItem"]
  .map(name => [name, name]));

function load<T>(url: URL, resolve: (name: string) => unknown): T {
  const module = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(url, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, require(name: string) {
    if (name === "react") return React;
    if (name === "react/jsx-runtime") return jsx;
    if (name === "@heroui/react") return heroui;
    if (name === "lucide-react") return { ChevronDown: "svg", X: "svg" };
    if (name === "framer-motion") return { useReducedMotion: () => false };
    if (name.endsWith(".css")) return { default: {} };
    if (name.endsWith("ErrorToast")) return { ErrorToast: () => null };
    if (name.endsWith("LoadingOrb")) return { LoadingOrb: "loading-orb" };
    if (name.endsWith("product-doc-response")) return { productDocErrorCode };
    if (name.endsWith("useProductDocResource")) return { useProductDocResource };
    return resolve(name);
  } });
  return module.exports as T;
}
const modal = load<typeof import("../../../overlay/ProductDocModal")>(new URL("../../../overlay/ProductDocModal.tsx", import.meta.url), () => undefined);
const { ProductDocPublishPreview } = load<typeof import("../ProductDocPublishPreview")>(new URL("../ProductDocPublishPreview.tsx", import.meta.url),
  name => name.endsWith("ProductDocModal") ? modal : undefined);

async function renderPreview(t: test.TestContext, busy: boolean, getImpact?: ProductDocsApi["getImpact"]) {
  let closed = 0;
  const published: number[] = [];
  const api = { async getImpact(requestScope, id, options) {
    assert.deepEqual(requestScope, scope);
    assert.equal(id, "doc");
    assert.equal(options?.expectedDraftVersion, 2);
    return getImpact ? getImpact(requestScope, id, options) : impact;
  } } satisfies Pick<ProductDocsApi, "getImpact">;
  let renderer!: ReactTestRenderer;
  t.after(() => act(() => renderer.unmount()));
  await act(async () => { renderer = create(<ProductDocPublishPreview api={api as unknown as ProductDocsApi} scope={scope}
    docId="doc" version={2} locale="en" isUpdate busy={busy} onClose={() => closed++} onPublish={version => published.push(version)} />); });
  return { renderer, published, closed: () => closed };
}

test("publishing locks review dismissal and both footer actions while retaining the modal", async t => {
  const { renderer, closed } = await renderPreview(t, true);
  act(() => renderer.root.findByType("Modal" as Parameters<ReactTestRenderer["root"]["findByType"]>[0]).props.onClose());
  assert.equal(closed(), 0, "Escape and outside dismissal must wait for publication");
  const buttons = renderer.root.findAllByType("Button" as Parameters<ReactTestRenderer["root"]["findByType"]>[0]);
  assert.ok(buttons.every(button => button.props.isDisabled), "close, editor and publish controls must be disabled together");
});

test("review uses one shared fade shell and returns to the editor when idle", async t => {
  const { renderer, closed, published } = await renderPreview(t, false);
  const shell = renderer.root.findByType("Modal" as Parameters<ReactTestRenderer["root"]["findByType"]>[0]);
  assert.equal(shell.props.disableAnimation, true, "do not independently scale the viewport wrapper and animate a second backdrop");
  assert.equal(shell.props.backdrop, "transparent");
  assert.equal(shell.props.scrollBehavior, "inside");
  const buttons = renderer.root.findAllByType("Button" as Parameters<ReactTestRenderer["root"]["findByType"]>[0]);
  act(() => buttons.find(button => button.children.includes("Publish changes"))!.props.onPress());
  assert.deepEqual(published, [2]);
  act(() => buttons.find(button => button.children.includes("Back to editor"))!.props.onPress());
  assert.equal(closed(), 1);
});


test("review filters unaffected links while following cursors through full linked-case pages", async t => {
  const cursors: Array<string | undefined> = [];
  const linked = (caseId: string, affected: boolean) => ({ caseId, title: caseId, affected, sectionId: null, needsUpdate: false, missingSection: false });
  const { renderer } = await renderPreview(t, false, async (_scope, _id, options) => {
    cursors.push(options?.cursor);
    return { ...impact, totalLinkedCases: 4, affectedCases: 2, nextCursor: options?.cursor ? null : "next",
      cases: options?.cursor ? [linked("Affected one", true), linked("Unchanged two", false), linked("Affected two", true)]
        : [linked("Unchanged one", false)] };
  });
  assert.equal(renderer.root.findAllByType("li").length, 0, "an unaffected first page must not be called potentially affected");
  await act(async () => renderer.root.findAllByType("Button" as Parameters<ReactTestRenderer["root"]["findByType"]>[0])
    .find(button => button.children.includes("Show more"))!.props.onPress());
  assert.deepEqual(cursors, [undefined, "next"]);
  assert.deepEqual(renderer.root.findAllByType("li").map(row => row.findByType("span").children.join("")), ["Affected one", "Affected two"]);
});
