import assert from "node:assert/strict";
import { test } from "node:test";
import { desktopResourceLink, desktopResourceAddress } from "../domain/resource-address";

const origin = "https://umbrella-falcon.saturnusgo.com";
const resource = `${origin}/work/?workspaceId=company&projectId=host&view=product-docs&docId=guide&docVersion=2&docSection=matching`;

test("desktop resource transport preserves company, project and exact document selection without login material", () => {
  assert.equal(desktopResourceAddress(resource), resource);
  const command = new URL(desktopResourceLink(resource)!);
  assert.equal(command.protocol, "falcon:");
  assert.equal(command.hostname, "open");
  assert.deepEqual([...command.searchParams], [["url", resource]]);
  assert.equal(desktopResourceAddress(resource.replace("/work/", "/testcases/umbrella-home/work/")), resource);
});

test("native resource addresses cannot target a foreign host, privileged page or authentication continuation", () => {
  for (const invalid of [resource.replace(origin, "https://evil.test"), resource.replace(origin, `${origin}.evil.test`),
    resource.replace(origin, "https://sandbox-falcon.saturnusgo.com"), resource.replace(origin, "https://user:pass@umbrella-falcon.saturnusgo.com"),
    resource.replace("/work/", "/api/v1/auth/desktop/consume"), resource.replace("/work/", "/admin/"),
    `${resource}&code=secret`, `${resource}&access_token=secret`, `${resource}&workspaceId=other`, `${resource}&docId=other`,
    resource.replace("workspaceId=company&", ""), `${resource}#../../admin`, resource.replace("https:", "http:")]) {
    assert.equal(desktopResourceLink(invalid), null, invalid);
  }
});

test("case attachment/history selections, repository scopes and dashboard drill routes remain navigable", () => {
  const cases = `${origin}/work/?workspaceId=company&view=cases&caseId=case-1&caseTab=attachments&repositoryProjectId=one&repositoryProjectId=two`;
  assert.equal(desktopResourceAddress(cases), cases);
  const detail = { kind: "workbench", selection: "openDefects", filters: { environmentId: "", buildReference: "" } };
  const dashboard = new URL(`${origin}/work/?workspaceId=company&projectId=host&view=dashboard`);
  dashboard.searchParams.set("dashboardDetail", JSON.stringify(detail));
  assert.equal(desktopResourceAddress(dashboard.href), dashboard.href);
  dashboard.searchParams.set("dashboardDetail", JSON.stringify({ kind: "unknown" }));
  assert.equal(desktopResourceAddress(dashboard.href), null);
});
