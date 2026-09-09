import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { createNavigationHistory, navigationEntry } from "../../history/history";

const require = createRequire(import.meta.url);
const routerSource = ts.createSourceFile("app-router.js", readFileSync(require.resolve("next/dist/client/components/app-router"), "utf8"), ts.ScriptTarget.ES2021, true);
function routerCode(predicate: (node: ts.Node) => boolean) {
  let found: ts.Node | undefined;
  const visit = (node: ts.Node) => { if (predicate(node)) found = node; ts.forEachChild(node, visit); };
  visit(routerSource);
  assert.ok(found, "The installed Next router must expose its native-history integration");
  return found.getText(routerSource);
}
function harness() {
  let href = "https://tms.example/work/?workspaceId=w&projectId=old&caseId=old-case";
  let canonicalUrl = href;
  let state: Record<string, unknown> = { __NA: true, __PRIVATE_NEXTJS_INTERNALS_TREE: ["router-tree"], customFlag: "preserve" };
  const writes: string[] = [];
  const storage = new Map<string, string>();
  const window = { location: { get href() { return href; } },
    history: { get state() { return state; },
      pushState: (_data: Record<string, unknown>, _title: string, _url: string) => {},
      replaceState: (_data: Record<string, unknown>, _title: string, _url: string) => {} },
    dispatchEvent: () => {}, sessionStorage: { getItem: (key: string) => storage.get(key), setItem: (key: string, value: string) => storage.set(key, value) } };
  const original = (data: Record<string, unknown>, _title: string, url: string) => { state = data; href = new URL(url, href).href; writes.push(href); };
  const copyCode = routerCode(node => ts.isFunctionDeclaration(node) && node.name?.text === "copyNextJsInternalHistoryState");
  const copyNextJsInternalHistoryState = runInNewContext(`(${copyCode})`, { window });
  for (const method of ["pushState", "replaceState"] as const) {
    const code = routerCode(node => ts.isFunctionExpression(node) && ts.isBinaryExpression(node.parent)
      && node.parent.left.getText(routerSource) === `window.history.${method}`);
    window.history[method] = runInNewContext(`(${code})`, { window, originalPushState: original, originalReplaceState: original,
      copyNextJsInternalHistoryState, applyUrlFromHistoryPushReplace: (url: string) => { canonicalUrl = new URL(url, href).href; } });
  }
  type BrowserHistory = typeof import("../workspace-history");
  const module = { exports: {} as BrowserHistory };
  const source = readFileSync(new URL("../workspace-history.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, {
    module, exports: module.exports, window, crypto: { randomUUID: () => "session" }, Event,
    require(name: string) { assert.equal(name, "../history/history"); return { createNavigationHistory, navigationEntry }; },
  });
  return { api: module.exports, href: () => href, state: () => state, canonical: () => canonicalUrl, writes,
    routerCommit: () => window.history.replaceState({ ...state, __NA: true }, "", canonicalUrl) };
}

test("native workspace navigation updates Next's canonical URL before its next commit", () => {
  const h = harness();
  const destination = "https://tms.example/work/?workspaceId=w&projectId=new&view=portfolios&portfolioId=portfolio";
  h.api.navigateWorkspace(destination);
  assert.equal(h.canonical(), destination);
  h.routerCommit();
  assert.equal(h.href(), destination);
  assert.equal(h.state().__NA, true);
  assert.equal(h.state().customFlag, "preserve");
  assert.equal(navigationEntry(h.state())?.index, 1);
});

test("saving scroll or folder context after navigation cannot restore the old case URL", () => {
  const h = harness();
  const destination = "https://tms.example/work/?workspaceId=w&projectId=new&view=cases&folderId=folder";
  h.api.navigateWorkspace(destination);
  h.api.saveNavigationContext("scroll", [{ top: 200 }]);
  h.api.saveNavigationContext("cases:new:folder", "/Payments");
  h.routerCommit();
  assert.equal(h.href(), destination);
  assert.equal(h.canonical(), destination);
  assert.equal(navigationEntry(h.state())?.context["cases:new:folder"], "/Payments");
  assert.equal(navigationEntry(h.state())?.index, 1);
});

test("replace canonicalization syncs Next while preserving Falcon's history entry", () => {
  const h = harness();
  h.api.initializeWorkspaceHistory();
  const destination = "https://tms.example/work/?workspaceId=w&projectId=new&view=config";
  h.api.navigateWorkspace(destination, true);
  h.routerCommit();
  assert.equal(h.href(), destination);
  assert.equal(navigationEntry(h.state())?.index, 0);
});
