import assert from "node:assert/strict";
import test from "node:test";
import type { Root } from "mdast";
import { caseReferenceHref, caseReferenceMarker, findCaseKeys, readCaseReferenceMarker } from "../caseReference";
import { remarkCaseReferences } from "../../markdown/remarkCaseReferences";

test("recognizes complete case keys in prose without consuming punctuation or URL/email destinations", () => {
  const prose = "See **HOST-TC-375**, (guide-tc-4), HOST-TC-0, HOST-TC-375extra; https://x.test/HOST-TC-375, www.x/HOST-TC-375 user+HOST-TC-375@x.test /HOST-TC-375";
  assert.deepEqual(findCaseKeys(prose).map(match => [match.key, prose.slice(match.start, match.end)]), [
    ["HOST-TC-375", "HOST-TC-375"], ["GUIDE-TC-4", "guide-tc-4"],
  ]);
  assert.equal(readCaseReferenceMarker(caseReferenceMarker("HOST-TC-375")), "HOST-TC-375");
  assert.equal(readCaseReferenceMarker("#falcon-case-key=HOST-TC-375%20bad"), null);
  assert.equal(readCaseReferenceMarker("#falcon-case-key=%F0"), null);
});

test("remark leaves code, authored links and raw HTML untouched; unknown keys only receive a resolution marker", () => {
  const root: Root = { type: "root", children: [
    { type: "paragraph", children: [
      { type: "text", value: "Use HOST-TC-375 and HOST-TC-999." },
      { type: "inlineCode", value: "HOST-TC-375" },
      { type: "link", url: "/example", children: [{ type: "text", value: "HOST-TC-375" }] },
    ] },
    { type: "code", value: "HOST-TC-375" },
    { type: "html", value: "<p>HOST-TC-375</p>" },
  ] };
  remarkCaseReferences()(root);
  const paragraph = root.children[0];
  assert.equal(paragraph.type, "paragraph");
  if (paragraph.type !== "paragraph") return;
  assert.deepEqual(paragraph.children.filter(node => node.type === "link").map(node => node.url), [
    "#falcon-case-key=HOST-TC-375", "#falcon-case-key=HOST-TC-999", "/example",
  ]);
  assert.equal(root.children[1].type, "code");
  assert.equal(root.children[2].type, "html");
  const snapshot = JSON.stringify(root);
  remarkCaseReferences()(root);
  assert.equal(JSON.stringify(root), snapshot, "repeated rendering must not nest links");
});

test("canonical link contains real IDs and stays on the supplied company origin", () => {
  const href = caseReferenceHref({ id: "case-real", projectId: "other-project", key: "HOST-TC-375", title: "Real title" },
    { workspaceId: "company-a", projectId: "current" }, "https://company.falcon.test");
  const url = new URL(href);
  assert.equal(url.origin, "https://company.falcon.test");
  assert.equal(url.pathname, "/work/");
  assert.equal(url.searchParams.get("caseId"), "case-real");
  assert.equal(url.searchParams.get("projectId"), "other-project");
  assert.equal(url.searchParams.get("workspaceId"), "company-a");
});
