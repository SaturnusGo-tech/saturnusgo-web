import assert from "node:assert/strict";
import test from "node:test";
import { workspaceReturnPath } from "../../model/workspace-return";

const origin = "https://umbrella-falcon.saturnusgo.com";
const selection = "?workspaceId=space&projectId=project&view=product-docs&docId=document&docVersion=2&docSection=procedure#section";

test("workspace returns preserve document context, normalize the retired route and strip auth callbacks", () => {
  for (const pathname of ["/work/", "/testcases/umbrella-home/work/"]) {
    assert.equal(workspaceReturnPath(origin + pathname + selection, origin), "/work/" + selection);
    assert.equal(workspaceReturnPath(pathname + "?workspaceId=space&code=private&state=private&error=private", origin), "/work/?workspaceId=space");
  }
});

test("workspace returns cannot target other origins, public pages, APIs or protocol-relative addresses", () => {
  for (const invalid of [null, "", "//evil.test/work/", "https://evil.test/work/", "https://other-falcon.saturnusgo.com/work/",
    "https://user:password@umbrella-falcon.saturnusgo.com/work/", "/privacy/", "/ru/", "/cloud-login/", "/api/v1/auth/logout",
    "/work/child", "/work/../", "/work/\\evil", "/work/?x=%0d%0aLocation:evil", "/work/?x=\nprivate"]) {
    assert.equal(workspaceReturnPath(invalid, origin), null, String(invalid));
  }
});
