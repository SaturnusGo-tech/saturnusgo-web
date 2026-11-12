import assert from "node:assert/strict";
import { test } from "node:test";
import { safeContinuationPath, hasContinuationContext } from "../../../continuation/domain/continuation-path";
import { cloudWorkspacePathFromLocation, type CloudSession } from "../../cloud-auth-client";
const session = { workspace: { id: "workspace" }, defaultProject: { id: "project" } } as CloudSession;
test("the native preferences window keeps its exact authenticated path without a project redirect", () => {
  assert.equal(cloudWorkspacePathFromLocation({ pathname: "/work/notification-preferences/", search: "?workspaceId=workspace", hash: "" }, session),
    "/work/notification-preferences/?workspaceId=workspace");
});
test("a different workspace cannot retain the native settings route", () => {
  assert.notEqual(cloudWorkspacePathFromLocation({ pathname: "/work/notification-preferences/", search: "?workspaceId=other", hash: "" }, session),
    "/work/notification-preferences/?workspaceId=other");
});

test("the authenticated auxiliary screen survives a normal cloud session continuation", () => {
  const path = "/work/notification-preferences/?workspaceId=workspace";
  assert.equal(safeContinuationPath(path, "https://tms.saturnusgo.com"), path);
  assert.equal(hasContinuationContext(path, "https://tms.saturnusgo.com"), true);
});
