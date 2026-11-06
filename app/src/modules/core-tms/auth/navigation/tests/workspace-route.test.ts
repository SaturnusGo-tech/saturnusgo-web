import assert from "node:assert/strict";
import { test } from "node:test";
import { safeTmsReturnPath } from "../tms-auth-route";
import { safeContinuationPath } from "../../continuation/domain/continuation-path";
import { spaceRedirect } from "../../spaces/domain/space-redirect";
import { workspaceHandoffNavigation } from "../../workspace-handoff/domain/handoff-policy";
const origin = "https://tms.saturnusgo.com", legacy = "/testcases/umbrella-home/work/";
test("canonical and saved legacy auth returns normalize to the exact neutral workspace document", () => {
  for (const path of ["/work/", legacy]) {
    assert.equal(safeTmsReturnPath(`${path}?workspaceId=space&caseId=case#step`), "/work/?workspaceId=space&caseId=case#step");
    assert.equal(safeContinuationPath(`${path}?workspaceId=space&caseId=case&code=secret#step`, origin), "/work/?workspaceId=space&caseId=case#step");
    assert.equal(spaceRedirect(origin + path, origin, "personal"), origin + "/work/");
  }
  for (const path of ["/work/child", legacy + "child", "/api/v1/work/", "//evil.test/work/"]) {
    assert.equal(safeTmsReturnPath(path), "/work/");
    assert.equal(safeContinuationPath(path, origin), null);
  }
});
test("cross-host handoff emits the canonical document even when opened from a legacy deep link", () => {
  const result = workspaceHandoffNavigation({ workspaceId: "space", generation: 1, destinationOrigin: "https://team-falcon.saturnusgo.com" }, "space", origin + legacy + "?caseId=case", "en", false);
  assert.equal(result?.kind, "browser");
  if (result?.kind === "browser") assert.equal(result.fields.route, "/work/?workspaceId=space&caseId=case&lang=en");
});
