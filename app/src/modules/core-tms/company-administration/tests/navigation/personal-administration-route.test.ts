import assert from "node:assert/strict";
import { test } from "node:test";
import { hasPersonalAdministrationScope, personalAdministrationReturnUrl, personalAdministrationUrl } from "../../navigation/personal-administration-route";
test("personal administration carries context and never treats a URL as membership proof", () => {
  const source = "https://falcon.test/testcases/umbrella-home/work/?workspaceId=foreign&projectId=project&token=secret&view=config";
  const path = personalAdministrationUrl(source, "actual-space", "audit");
  assert.equal(path, "/admin/?account=personal&workspaceId=actual-space&projectId=project&page=audit");
  assert.equal(hasPersonalAdministrationScope(`https://falcon.test${path}`, "actual-space"), true);
  assert.equal(hasPersonalAdministrationScope(`https://falcon.test${path}`, "foreign"), false);
  assert.equal(hasPersonalAdministrationScope("https://falcon.test/admin/?workspaceId=actual-space", "actual-space"), false);
  assert.equal(personalAdministrationReturnUrl(`https://falcon.test${path}`, "actual-space"), "/testcases/umbrella-home/work/?workspaceId=actual-space&projectId=project");
});
