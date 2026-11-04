import assert from "node:assert/strict";
import { test } from "node:test";
import { spaceRedirect } from "../../domain/space-redirect";
void test("space selection redirects only to its own personal workspace or a canonical company launch", () => {
  const origin = "https://tms.saturnusgo.com";
  assert.equal(spaceRedirect(`${origin}/testcases/umbrella-home/work/`, origin, "personal"), `${origin}/testcases/umbrella-home/work/`);
  assert.equal(spaceRedirect("https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch", origin, "company"), "https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch");
  for (const address of ["https://evil.test/", "https://alpha-falcon.saturnusgo.com.evil.test/api/v1/auth/google/launch", "https://user@alpha-falcon.saturnusgo.com/api/v1/auth/google/launch", "https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch?returnTo=evil", `${origin}/api/v1/auth/google/launch`, "http://127.0.0.1/callback"]) assert.equal(spaceRedirect(address, origin, "company"), null);
});
