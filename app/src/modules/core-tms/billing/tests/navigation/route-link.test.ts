import assert from "node:assert/strict";
import { test } from "node:test";
import type { BillingLink } from "../../presentation/link/BillingLink";
import { workspaceBillingUrl } from "../../navigation/billing-route";
import { componentHarness, invoke, nodes } from "../../../portfolios/tests/support/component-harness";

for (const path of ["/testcases/umbrella-home/work/", "/testcases/umbrella-home/ui-preview/"]) test(`billing navigation retains workspace scope on ${path}`, () => {
  const href = `https://falcon.example${path}?workspaceId=w&projectId=p&view=runs&runId=r&caseId=c#secret`;
  const target = new URL(workspaceBillingUrl(href), href);
  assert.equal(target.pathname, path);
  assert.equal(target.search, "?workspaceId=w&projectId=p&view=config&settings=billing");
  assert.equal(target.hash, "");
});

test("billing links outside the workspace return to the active workspace without unrelated state", () => {
  assert.equal(workspaceBillingUrl("https://falcon.example/company/?workspaceId=old&token=secret", "active"),
    "/testcases/umbrella-home/work/?workspaceId=active&view=config&settings=billing");
  assert.equal(workspaceBillingUrl("https://falcon.example/profile/?workspaceId=../invalid&projectId=%2Fevil"),
    "/testcases/umbrella-home/work/?view=config&settings=billing");
});

function linkHarness(path: string) {
  const calls: string[] = [], h = componentHarness(`https://falcon.example${path}?workspaceId=w&view=cases`);
  const { BillingLink: render } = h.load<{ BillingLink: typeof BillingLink }>(new URL("../../presentation/link/BillingLink.tsx", import.meta.url), name => {
    if (name.endsWith("workspace-history")) return { visitWorkspace: (href: string) => calls.push(href) };
    if (name.endsWith("billing-route")) return { workspaceBillingUrl, isWorkspaceBillingNavigation: (href: string) => ["/testcases/umbrella-home/work/", "/testcases/umbrella-home/ui-preview/"].includes(new URL(href).pathname) };
  });
  const link = nodes(h.render(() => render({ children: "Plan and billing" })))[0];
  const click = (extra = {}) => {
    let prevented = false;
    invoke(link, "onClick", { button: 0, preventDefault() { prevented = true; }, ...extra });
    return prevented;
  };
  return { calls, link, click };
}

test("normal billing clicks use workspace history while modifier clicks keep native link behavior", () => {
  const h = linkHarness("/testcases/umbrella-home/work/");
  assert.equal(h.click(), true); assert.equal(h.calls.length, 1);
  for (const extra of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) assert.equal(h.click(extra), false);
  assert.equal(h.calls.length, 1);
  const external = linkHarness("/company/");
  assert.equal(external.click(), false); assert.equal(external.calls.length, 0);
  assert.match(external.link.props.href as string, /\/work\/\?workspaceId=w&view=config&settings=billing$/);
});
