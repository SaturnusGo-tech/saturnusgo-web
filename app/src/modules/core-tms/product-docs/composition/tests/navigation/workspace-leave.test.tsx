import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { act, create } from "react-test-renderer";
import ts from "typescript";
import { AuthoringLeaveCoordinator } from "../../../../authoring/leave/application/leave-coordinator";
import * as docLinks from "../../../navigation/product-doc-link";
import { buildWorkspaceDeepLink } from "../../../../state/navigation/workspace-deep-link";

function harness(visible: boolean) {
  const leave = new AuthoringLeaveCoordinator();
  let update: (() => void) | undefined;
  let finish: (() => void) | undefined;
  let prompts = 0;
  const navigated: string[] = [];
  const window = { location: { href: "https://falcon.example/work/?workspaceId=w&projectId=p&view=cases" },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, history: { state: {} } };
  const requestAuthoringLeave = leave.request.bind(leave);
  function load<T>(path: URL, dependencies: (name: string) => unknown): T {
    const module = { exports: {} };
    const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText;
    runInNewContext(code, { module, exports: module.exports, URL, window, Event, PopStateEvent: Event,
      require: dependencies });
    return module.exports as T;
  }
  const history = load<typeof import("../../../../state/navigation/browser/workspace-history")>(
    new URL("../../../../state/navigation/browser/workspace-history.ts", import.meta.url), name => {
      if (name.endsWith("authoring-leave")) return { requestAuthoringLeave };
      if (name.endsWith("content-transition")) return { transitionContent: (commit: () => void) =>
        new Promise<void>(resolve => { update = commit; finish = resolve; }) };
      if (name.endsWith("navigation-context-store")) return { createNavigationContextStore: () => ({}) };
      if (name.endsWith("history/history")) return { createNavigationHistory: () => ({ write: (href: string) => {
        navigated.push(href); window.location.href = href;
      } }) };
      throw new Error(name);
    });
  const context = React.createContext(null);
  const { ProductDocsWorkspace } = load<typeof import("../../ProductDocsWorkspace")>(
    new URL("../../ProductDocsWorkspace.tsx", import.meta.url), name => {
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return jsx;
      if (name.endsWith("authoring-leave")) return { requestAuthoringLeave };
      if (name.endsWith("workspace-history")) return history;
      if (name.endsWith("workspace-deep-link")) return { buildWorkspaceDeepLink };
      if (name.endsWith("product-doc-link")) return docLinks;
      if (name.endsWith("ProductDocsContext")) return { ProductDocsContext: context };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
      if (name.endsWith("TmsSessionContext")) return { useOptionalTmsSession: () => null };
      if (name.endsWith("useProductDocDraftSession")) return { useProductDocDraftSession: () => new Map() };
      if (name.endsWith("CaseReferenceProvider")) return { CaseReferenceProvider: ({ children }: React.PropsWithChildren) => children };
      const parts = name.split("/"); const component = parts[parts.length - 1];
      if (component.startsWith("ProductDoc")) return { [component]: (props: object) => React.createElement(component, props) };
      throw new Error(name);
    });
  leave.register("case", () => ({ dirty: true }));
  leave.setPresenter(async () => { prompts++; return true; });
  const render = create(<ProductDocsWorkspace api={{} as never} scope={{ workspaceId: "w", projectId: "p" }}
    workspace={{ data: { projects: [], testCases: [] } } as never} visible={visible} enabled contentRef={{ current: null }}>
    <span>Repository</span>
  </ProductDocsWorkspace>);
  const navigate = () => visible
    ? render.root.find(node => node.type === "ProductDocsView" as React.ElementType).props.onSelect({ docId: "article" })
    : render.root.find(node => node.type === "ProductDocsPanel" as React.ElementType).props.onOpenFull({ docId: "article" });
  return { leave, navigate, navigated, prompts: () => prompts,
    frame: () => { assert.ok(update); update(); finish!(); }, dispose: () => render.unmount() };
}

test("opening a document preview full screen awaits its deferred workspace transition", async () => {
  const h = harness(false);
  try {
    await act(async () => { h.navigate(); await Promise.resolve(); });
    assert.equal(h.leave.isPending(), true, "the approved intent owns the pending transition");
    assert.equal(await h.leave.request(() => assert.fail("unrelated navigation")), false);
    await act(async () => { h.frame(); });
    assert.equal(h.navigated.length, 1);
    assert.equal(new URL(h.navigated[0]).searchParams.get("docId"), "article");
    assert.equal(h.prompts(), 1);
    assert.equal(h.leave.isPending(), false);
  } finally { act(() => h.dispose()); }
});

test("selecting a document inside Docs remains a single approved synchronous intent", async () => {
  const h = harness(true);
  try {
    await act(async () => { h.navigate(); });
    assert.equal(h.navigated.length, 1);
    assert.equal(h.prompts(), 1);
    assert.equal(h.leave.isPending(), false);
  } finally { act(() => h.dispose()); }
});
