import assert from "node:assert/strict";
import { test } from "node:test";
import { spaceRedirect } from "../../domain/space-redirect";
void test("space selection redirects only to its own personal workspace or a canonical company launch", () => {
  const origin = "https://tms.saturnusgo.com";
  assert.equal(spaceRedirect(`${origin}/testcases/umbrella-home/work/`, origin, "personal"), `${origin}/work/`);
  assert.equal(spaceRedirect("https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch", origin, "company"), "https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch");
  for (const address of ["https://evil.test/", "https://alpha-falcon.saturnusgo.com.evil.test/api/v1/auth/google/launch", "https://user@alpha-falcon.saturnusgo.com/api/v1/auth/google/launch", "https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch?returnTo=evil", `${origin}/api/v1/auth/google/launch`, "http://127.0.0.1/callback"]) assert.equal(spaceRedirect(address, origin, "company"), null);
});
void test("company choices admit only scoped company password or provider entries with narrow desktop continuation", () => {
  const origin = "https://tms.saturnusgo.com", attempt = "a".repeat(43);
  for (const address of [
    "https://alpha-falcon.saturnusgo.com/cloud-login/?workspaceId=workspace-1",
    `${origin}/cloud-login/?workspaceId=workspace-1`,
    `https://alpha-falcon.saturnusgo.com/cloud-login/?workspaceId=workspace-1&desktopAttempt=${attempt}`,
    `https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch?desktopAttempt=${attempt}`,
    `https://alpha-falcon.saturnusgo.com/api/v1/auth/saml/workspace-1/launch?desktopAttempt=${attempt}`,
  ]) assert.equal(spaceRedirect(address, origin, "company"), address);
  for (const address of [
    `${origin}/cloud-login/`, `${origin}/cloud-login/?workspaceId=one&workspaceId=two`,
    `${origin}/cloud-login/?workspaceId=one&desktopAttempt=bad`, `${origin}/cloud-login/?workspaceId=one&returnTo=https://evil.test`,
    "https://evil.test/cloud-login/?workspaceId=one", "https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch?token=secret",
  ]) assert.equal(spaceRedirect(address, origin, "company"), null, address);
});
void test("a converted cloud company choice retains only its same-origin verified workspace handoff", () => {
  const origin = "https://tms.saturnusgo.com", attempt = "a".repeat(43);
  const handoff = `${origin}/cloud-login/?workspaceId=personal-owner&workspaceHandoff=1`;
  for (const address of [handoff, `${handoff}&desktopAttempt=${attempt}`]) assert.equal(spaceRedirect(address, origin, "company"), address);
  for (const address of [
    handoff.replace(origin, "https://alpha-falcon.saturnusgo.com"), handoff.replace(origin, "https://evil.test"),
    handoff.replace("/cloud-login/", "/cloud-login/child"), handoff.replace("/cloud-login/", "/api/v1/auth/google/launch"),
    handoff.replace("workspaceHandoff=1", "workspaceHandoff=0"), handoff.replace("workspaceId=personal-owner&", ""),
    `${handoff}&workspaceId=other`, `${handoff}&workspaceHandoff=1`, `${handoff}&desktopAttempt=bad`,
    `${handoff}&desktopAttempt=${attempt}&desktopAttempt=${attempt}`, `${handoff}&method=company`, `${handoff}&returnTo=/work/`, `${handoff}#proof`,
  ]) assert.equal(spaceRedirect(address, origin, "company"), null, address);
});
void test("a personal chooser return preserves only one bounded desktop attempt on the exact canonical or legacy workspace", () => {
  const origin = "https://tms.saturnusgo.com", attempt = "a".repeat(43), expected = `${origin}/work/?desktopAttempt=${attempt}`;
  for (const path of ["/work/", "/testcases/umbrella-home/work/"]) assert.equal(spaceRedirect(`${origin}${path}?desktopAttempt=${attempt}`, origin, "personal"), expected);
  for (const address of [
    expected.replace(origin, "https://alpha-falcon.saturnusgo.com"), expected.replace(origin, "https://evil.test"),
    expected.replace("/work/", "/work/child"), expected.replace(attempt, "bad"), `${expected}&desktopAttempt=${attempt}`,
    `${expected}&workspaceId=other`, `${expected}&workspaceHandoff=1`, `${expected}&returnTo=/admin/`, `${expected}#proof`,
  ]) assert.equal(spaceRedirect(address, origin, "personal"), null, address);
});
