import assert from "node:assert/strict";
import test from "node:test";
import { isWorkspaceProfileNavigation, workspaceProfileUrl } from "../navigation/profile-route";
import { buildWorkspaceDeepLink, readWorkspaceDeepLink } from "../../state/navigation/workspace-deep-link";
import { companyViewAvailable } from "../../auth/managed/domain/features/company-features";

const origin = "https://darwin-falcon.example.test";
const work = `${origin}/testcases/umbrella-home/work/`;

test("personal profile keeps tenant/project context without opening an admin route or selected case", () => {
  const link = workspaceProfileUrl(`${work}?workspaceId=w&projectId=p&caseId=c&view=cases&folderId=f&runId=r`);
  const url = new URL(link, origin);
  assert.equal(url.pathname, "/testcases/umbrella-home/work/");
  assert.deepEqual(Object.fromEntries(url.searchParams), {workspaceId:"w",projectId:"p",view:"profile"});
  assert.deepEqual(readWorkspaceDeepLink(url.href), {view:"profile",runId:null});
});

test("old profile bookmarks resolve inside TMS even before the first project exists", () => {
  assert.equal(workspaceProfileUrl(`${origin}/profile/`), "/testcases/umbrella-home/work/?view=profile");
  assert.equal(workspaceProfileUrl(`${origin}/profile/#security`), "/testcases/umbrella-home/work/?view=profile#security");
  assert.equal(isWorkspaceProfileNavigation(`${origin}/profile/`), false);
  assert.equal(isWorkspaceProfileNavigation(`${work}?view=cases`), true);
  assert.equal(companyViewAvailable("profile", []), true);
});

test("security anchor survives workspace URL reconciliation", () => {
  const url = new URL(workspaceProfileUrl(`${work}?workspaceId=w&projectId=p`, "security"), origin);
  const reconciled = buildWorkspaceDeepLink(url.href, {workspaceId:"w",projectId:"p",view:"profile",runId:null});
  assert.equal(new URL(reconciled).hash, "#security");
  const cases = buildWorkspaceDeepLink(reconciled, {workspaceId:"w",projectId:"p",view:"cases",runId:null});
  assert.equal(new URL(cases).hash, "");
});

test("profile navigation does not copy arbitrary redirects, invalid scope or admin selection", () => {
  const url = new URL(workspaceProfileUrl(`${origin}/profile/?workspaceId=../foreign&projectId=%2Fsecret&id=other&returnTo=https://evil.test`), origin);
  assert.equal(url.origin, origin);
  assert.deepEqual(Object.fromEntries(url.searchParams), {view:"profile"});
});
