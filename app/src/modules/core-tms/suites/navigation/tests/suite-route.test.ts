import assert from "node:assert/strict";
import test from "node:test";
import { buildSuiteRoute, readSuiteRoute } from "../suite-route";
import { buildWorkspaceDeepLink } from "../../../state/navigation/workspace-deep-link";
const base = "https://tms.example.test/work/?workspaceId=workspace-a&projectId=project-a&view=suites";
test("suite catalog is the default and does not select the first suite", () => {
 assert.equal(readSuiteRoute(base,"workspace-a","project-a"),null);
 assert.equal(new URL(buildSuiteRoute(base,"workspace-a","project-a",null)).searchParams.has("suiteId"),false);
});
test("suite detail URLs round trip and the back target removes only suite selection", () => {
 const detail = buildSuiteRoute(base,"workspace-a","project-a","suite-123");
 assert.equal(readSuiteRoute(detail,"workspace-a","project-a"),"suite-123");
 assert.equal(readSuiteRoute(buildSuiteRoute(detail,"workspace-a","project-a",null),"workspace-a","project-a"),null);
 assert.equal(new URL(detail).pathname,"/work/");
});
test("details from other scopes or invalid suite IDs never open", () => {
 const detail = `${base}&suiteId=suite-123`;
 assert.equal(readSuiteRoute(detail,"workspace-b","project-a"),null);
 assert.equal(readSuiteRoute(detail,"workspace-a","project-b"),null);
 assert.equal(readSuiteRoute(detail.replace("view=suites","view=cases"),"workspace-a","project-a"),null);
 for (const id of ["x".repeat(129),"<script>","a/b","a\"b"]) {
  assert.equal(readSuiteRoute(`${base}&suiteId=${encodeURIComponent(id)}`,"workspace-a","project-a"),null);
  assert.equal(new URL(buildSuiteRoute(base,"workspace-a","project-a",id)).searchParams.has("suiteId"),false);
 }
});
test("workspace navigation preserves suite detail only in the same suite scope", () => {
 const detail = `${base}&suiteId=suite-123`;
 const input = {workspaceId:"workspace-a",projectId:"project-a",view:"suites" as const,runId:null};
 assert.equal(new URL(buildWorkspaceDeepLink(detail,input)).searchParams.get("suiteId"),"suite-123");
 assert.equal(new URL(buildWorkspaceDeepLink(detail,{...input,projectId:"project-b"})).searchParams.has("suiteId"),false);
 assert.equal(new URL(buildWorkspaceDeepLink(detail,{...input,view:"runs"})).searchParams.has("suiteId"),false);
});
