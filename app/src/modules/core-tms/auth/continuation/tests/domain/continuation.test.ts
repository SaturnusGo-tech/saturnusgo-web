import assert from "node:assert/strict";
import { test } from "node:test";
import { rememberContinuation, takeContinuation, CONTINUATION_KEY } from "../../application/continuation-storage";
import { safeContinuationPath } from "../../domain/continuation-path";
function storage() { const values = new Map<string, string>(); return {
  getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); },
}; }
const origin = "https://alpha-falcon.example.test";
const page = { origin, pathname: "/testcases/umbrella-home/work/", search: "?caseId=case-7&workspaceId=alpha&falconMcpInteraction=consent_123", hash: "#step-2" };
void test("continuation stores the validated deep link per tab and consumes it once", () => {
  const tab = storage(); rememberContinuation(tab, page, 1000);
  assert.equal(takeContinuation(tab, origin, "alpha", 2000), "/work/?caseId=case-7&workspaceId=alpha&falconMcpInteraction=consent_123#step-2");
  assert.equal(takeContinuation(tab, origin, "alpha", 2000), null);
});
void test("expired, future, foreign-origin or different-workspace continuations are discarded", () => {
  for (const record of [
    { origin, createdAt: 1000, path: "/testcases/umbrella-home/work/?caseId=case-1" },
    { origin, createdAt: 999999, path: "/testcases/umbrella-home/work/?caseId=case-1" },
    { origin: "https://other-falcon.example.test", createdAt: 400000, path: "/testcases/umbrella-home/work/?caseId=case-1" },
    { origin, createdAt: 400000, path: "/testcases/umbrella-home/work/?workspaceId=other&caseId=case-1" },
  ]) {
    const tab = storage(); tab.setItem(CONTINUATION_KEY, JSON.stringify({ version: 1, ...record }));
    assert.equal(takeContinuation(tab, origin, "alpha", 400001), null);
    assert.equal(tab.getItem(CONTINUATION_KEY), null);
  }
});
void test("external/auth routes and callback secrets cannot become continuation targets", () => {
  for (const candidate of ["//evil.test/", "https://alpha-falcon.example.test/testcases/umbrella-home/work/", "/api/v1/auth/google/callback?code=secret", "/desktop-sign-in/", "/testcases/umbrella-home/work/\\evil"]) assert.equal(safeContinuationPath(candidate, origin), null);
  assert.equal(safeContinuationPath("/testcases/umbrella-home/work/?caseId=case-1&code=secret&state=state&returnTo=https://evil.test&access_token=token#access_token=secret", origin), "/work/?caseId=case-1");
});
void test("a login entry can preserve only its valid MCP interaction and storage restrictions are nonfatal", () => {
  const tab = storage(); rememberContinuation(tab, { ...page, pathname: "/login/", search: "?falconMcpInteraction=consent_1&code=secret", hash: "" }, 1000);
  assert.equal(takeContinuation(tab, origin, "alpha", 2000), "/work/?falconMcpInteraction=consent_1");
  const denied = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  assert.doesNotThrow(() => rememberContinuation(denied, page)); assert.equal(takeContinuation(denied, origin), null);
});
void test("retrying sign-in from a provider's default return cannot replace the original deep target", () => {
  for (const search of ["", "?workspaceId=alpha"]) {
    const tab = storage(); rememberContinuation(tab, page, 1000);
    rememberContinuation(tab, { ...page, search, hash: "" }, 1500);
    assert.equal(takeContinuation(tab, origin, "alpha", 2000), "/work/?caseId=case-7&workspaceId=alpha&falconMcpInteraction=consent_123#step-2");
  }
});
void test("Startup identity refresh returns to the same workspace billing settings and language", () => {
  const tab = storage();
  rememberContinuation(tab, { ...page, search: "?workspaceId=alpha&view=config&settings=billing&lang=ru&token=secret", hash: "" }, 1000);
  assert.equal(takeContinuation(tab, origin, "alpha", 2000), "/work/?workspaceId=alpha&view=config&settings=billing&lang=ru");
});
void test("the public guide AI entry resumes inside the authenticated chat without accepting arbitrary redirects", () => {
  for (const pathname of ["/login/", "/cloud-login/", "/signup/"]) {
    const tab = storage();
    rememberContinuation(tab, { ...page, pathname, search: "?lang=ru&guide=chat&returnTo=https://evil.test&code=secret", hash: "" }, 1000);
    assert.equal(takeContinuation(tab, origin, "alpha", 2000), "/work/?view=help&article=falcon-ai-chat");
  }
  for (const search of ["?guide=https://evil.test", "?guide=chat&guide=chat", "?guide=admin"]) {
    const tab = storage(); rememberContinuation(tab, { ...page, pathname: "/cloud-login/", search, hash: "" }, 1000);
    assert.equal(takeContinuation(tab, origin, "alpha", 2000), null);
  }
});
