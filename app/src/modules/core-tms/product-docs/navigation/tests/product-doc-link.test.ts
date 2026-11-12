import assert from "node:assert/strict";
import test from "node:test";
import { buildWorkspaceDeepLink, readWorkspaceDeepLink } from "../../../state/navigation/workspace-deep-link";
import { readProductDocSelection, readScopedProductDocLink, writeProductDocSelection } from "../product-doc-link";

import { readProductDocSmartTarget } from "../product-doc-smart-link";

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

test("description links can resolve metadata only on Falcon routes for the current project", () => {
  const href = work + "&docId=doc_1&docVersion=4&docSection=refund";
  assert.deepEqual(readScopedProductDocLink(href, work, scope), {docId: "doc_1", version: 4, sectionId: "refund"});
  assert.deepEqual(readScopedProductDocLink(href.replace("/work/", "/testcases/umbrella-home/work/"), work, scope),
    {docId: "doc_1", version: 4, sectionId: "refund"});
  for (const outside of [href.replace("falcon.example", "external.example"), href.replace("projectId=p", "projectId=p2"),
    href.replace("workspaceId=w&", ""), href.replace("/work/", "/api/v1/"), href.replace("docVersion=4", "docVersion=-1")]) {
    assert.equal(readScopedProductDocLink(outside, work, scope), undefined);
  }
});


test("smart links classify authorized-looking Falcon routes and leave unrelated paths alone", () => {
  assert.deepEqual(readProductDocSmartTarget("/work/?workspaceId=w&projectId=p&caseId=case_9", work, scope),
    { kind: "case", id: "case_9" });
  assert.deepEqual(readProductDocSmartTarget(work + "&docId=doc_1&docVersion=4&docSection=refund", work, scope),
    { kind: "document", id: "doc_1", version: 4, sectionId: "refund" });
  assert.deepEqual(readProductDocSmartTarget("https://other.example/guide", work, scope),
    { kind: "external", url: "https://other.example/guide" });
  for (const invalid of ["/work/?workspaceId=other&projectId=p&caseId=case_9",
    "/api/v1/?workspaceId=w&projectId=p&caseId=case_9", "javascript:alert(1)", "https://user:pw@other.example/"]) {
    assert.equal(readProductDocSmartTarget(invalid, work, scope), null);
  }
  assert.equal(readProductDocSmartTarget("#overview", work + "&docId=doc_1", scope), null);
});

test("repository references keep a real folder selector and project without leaving the company", () => {
  assert.deepEqual(readProductDocSmartTarget("/work/?workspaceId=w&projectId=other&view=cases&folderId=folder_42", work, scope),
    {kind: "repository", projectId: "other", folderId: "folder_42"});
  assert.deepEqual(readProductDocSmartTarget("/work/?workspaceId=w&projectId=p&view=cases&folderPath=Orders%2FMatching%20lifecycle", work, scope),
    {kind: "repository", projectId: "p", folderPath: "Orders/Matching lifecycle"});
  assert.deepEqual(readProductDocSmartTarget("/work/?workspaceId=w&projectId=other&caseId=case_1", work, scope),
    {kind: "case", id: "case_1", projectId: "other"});
  for (const href of ["/work/?workspaceId=other&projectId=p&view=cases&folderId=folder_42",
    "/api/v1/?workspaceId=w&projectId=p&view=cases&folderId=folder_42",
    "/work/?workspaceId=w&projectId=p&view=cases&folderId=bad%2Fid",
    "/work/?workspaceId=w&projectId=p&view=cases&folderId=one&folderId=two",
    "/work/?workspaceId=w&projectId=p&view=cases&folderPath=Orders%2F..%2Fprivate"]) {
    assert.equal(readProductDocSmartTarget(href, work, scope), null);
  }
});
