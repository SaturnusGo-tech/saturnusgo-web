import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkspaceDeepLink, readWorkspaceDeepLink } from "../../../state/navigation/workspace-deep-link";
import { readProductDocSelection, writeProductDocSelection } from "../product-doc-link";

const scope = {workspaceId: "w", projectId: "p", runId: null};
const work = "https://falcon.example/work/?workspaceId=w&projectId=p&view=product-docs";

test("deep links keep the pinned publication and section when opening the same project", () => {
  const exact = {docId: "doc_1", version: 12, sectionId: "scope_1"};
  const source = writeProductDocSelection(new URL(work), exact).href;
  const restored = buildWorkspaceDeepLink(source, {...scope, view: "product-docs"});
  assert.equal(readWorkspaceDeepLink(restored).view, "product-docs");
  assert.deepEqual(readProductDocSelection(restored), exact);
  assert.equal(readProductDocSelection(buildWorkspaceDeepLink(source, {...scope, projectId: "other", view: "product-docs"})), undefined);
  assert.equal(readProductDocSelection(buildWorkspaceDeepLink(source, {...scope, view: "cases"})), undefined);
});

test("a malformed version cannot silently open the latest publication", () => {
  assert.equal(readProductDocSelection(work + "&docId=doc_1&docVersion=0"), undefined);
  assert.equal(readProductDocSelection(work + "&docId=doc_1&docVersion=2147483648"), undefined);
  assert.equal(readProductDocSelection(work + "&docId=doc%2F1"), undefined);
  assert.deepEqual(readProductDocSelection(work + "&docId=doc_1"), {docId:"doc_1"});
});
