import assert from "node:assert/strict";
import { test } from "node:test";
import { swaggerWorkspaceUrl } from "../model";
import { authorizeSwaggerRequest } from "../renderer/swagger-request-policy";
test("Swagger navigation preserves workspace/project and removes unrelated selections", () => {
  const url = new URL(swaggerWorkspaceUrl("https://tms.saturnusgo.com/work/?workspaceId=w&projectId=p&caseId=c&view=cases&runId=r&article=abc", "hooks"));
  assert.equal(url.searchParams.get("workspaceId"), "w"); assert.equal(url.searchParams.get("projectId"), "p");
  assert.equal(url.searchParams.get("view"), "hooks"); assert.equal(url.searchParams.get("integration"), "swagger");
  assert.equal(url.searchParams.has("caseId"), false); assert.equal(url.searchParams.has("runId"), false);
  assert.equal(url.searchParams.has("article"), false);
  const api = new URL(swaggerWorkspaceUrl(url.href, "api"));
  assert.equal(api.searchParams.get("view"), "api"); assert.equal(api.searchParams.has("integration"), false);
});
test("Swagger API calls cannot target Falcon, its identity provider or online validators", () => {
  for (const url of ["https://tms.saturnusgo.com/work/", "https://api.tms.saturnusgo.com/api/v1/projects",
    "https://dev-4v1srvqwzp1m7cdl.us.auth0.com/oauth/token", "https://validator.swagger.io/validator/debug",
    "https://127.0.0.1/path", "http://api.company.com/path", "https://user:secret@api.company.com/path"]) {
    assert.throws(() => authorizeSwaggerRequest({ url }, "https://tms.saturnusgo.com"));
  }
  const request = { url: "https://api.company.com/v1/orders", credentials: "include", headers: { Authorization: "Bearer api-credential" } };
  assert.deepEqual(authorizeSwaggerRequest(request, "https://tms.saturnusgo.com"), { ...request, credentials: "omit" });
});
