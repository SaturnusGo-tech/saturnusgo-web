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
