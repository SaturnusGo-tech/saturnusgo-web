import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test, { type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsHttpClientProvider } from "../../../../../auth/http/TmsHttpClientContext";
import { TmsLocaleContext } from "../../../../../localization/context/TmsLocaleProvider";
import { ProductDocsContext } from "../../../../composition/context/ProductDocsContext";
import type { ProductDocsApi, ProductDocSelection } from "../../../../domain/product-docs";

const require = createRequire(import.meta.url);
const css = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { ProductDocSmartLink } = require("../ProductDocSmartLink") as typeof import("../ProductDocSmartLink");
if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];

async function renderLink(t: TestContext, title: string | null, children: string) {
  const previousWindow = globalThis.window;
  const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
  const browser = new EventTarget() as Window & typeof globalThis;
  Object.assign(browser, { location: { href: "https://team-falcon.saturnusgo.com/work/?workspaceId=w&projectId=p&view=product-docs" } });
  Object.assign(globalThis, { window: browser, React });
  const chosen: ProductDocSelection[] = [];
  const client = { async mutateResource(path: string, method: string, body: unknown) {
    assert.equal(path, "/workspaces/w/projects/p/product-docs/link-preview");
    assert.equal(method, "POST");
    assert.deepEqual(body, {kind: "document", id: "refunds", version: 3, sectionId: "scope"});
    return {data: {kind: "document", title, description: null, host: null, path: [], status: "published"}};
  } } as unknown as React.ComponentProps<typeof TmsHttpClientProvider>["client"];
  const href = "/work/?workspaceId=w&projectId=p&view=product-docs&docId=refunds&docVersion=3&docSection=scope";
  let renderer!: ReactTestRenderer;
  t.after(() => {
    act(() => renderer?.unmount()); globalThis.window = previousWindow;
    if (previousReact) Object.defineProperty(globalThis, "React", previousReact); else Reflect.deleteProperty(globalThis, "React");
  });
  await act(async () => { renderer = create(<TmsLocaleContext.Provider value={{locale: "ru", languageTag: "ru-RU", setLocale() {}, t: () => ""}}>
    <TmsHttpClientProvider client={client}><ProductDocsContext.Provider value={{scope: {workspaceId: "w", projectId: "p"}, api: {} as ProductDocsApi,
      open() {}, openDocument(selection) { chosen.push(selection); }}}>
      <ProductDocSmartLink href={href}>{children}</ProductDocSmartLink>
    </ProductDocsContext.Provider></TmsHttpClientProvider>
  </TmsLocaleContext.Provider>); });
  return {anchor: renderer.root.findByType("a"), chosen};
}

test("document references keep a document icon and resolved title instead of adopting a publication-status icon", async t => {
  const {anchor} = await renderLink(t, "Правила возвратов", "Открыть документацию");
  assert.equal(anchor.props["data-link-kind"], "document");
  assert.equal(anchor.findByType("span").children.join(""), "Правила возвратов");
  assert.match(anchor.findByType("svg").props.className, /lucide-file-text/);
  assert.equal(anchor.findByType("svg").props["data-link-status"], undefined);
});

test("blank document metadata falls back to the authored title without losing the sidebar destination", async t => {
  const {anchor, chosen} = await renderLink(t, " \n ", "Сценарии возвратов");
  assert.equal(anchor.findByType("span").children.join(""), "Сценарии возвратов");
  let prevented = false;
  act(() => anchor.props.onClick({button: 0, currentTarget: {}, preventDefault() { prevented = true; }}));
  assert.equal(prevented, true);
  assert.deepEqual(chosen, [{docId: "refunds", version: 3, sectionId: "scope"}]);
});

test("unavailable document metadata leaves a readable local label and modified clicks native", async t => {
  const {anchor, chosen} = await renderLink(t, null, "Сценарии возвратов");
  assert.equal(anchor.findByType("span").children.join(""), "Сценарии возвратов");
  let prevented = false;
  act(() => anchor.props.onClick({button: 0, metaKey: true, currentTarget: {}, preventDefault() { prevented = true; }}));
  assert.equal(prevented, false);
  assert.deepEqual(chosen, []);
});
