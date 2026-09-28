import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { notificationHref, notificationTime } from "../../model/presentation";
import type { NotificationRow } from "../../presentation/NotificationRow";
import type { NotificationItem } from "../../../domain/notifications";

test("a managed-company event renders as a current-origin link and clicking it reads then opens the entity", () => {
  const h = componentHarness(), reads: string[] = [], navigations: string[] = [];
  const { NotificationRow: Row } = h.load<{ NotificationRow: typeof NotificationRow }>(new URL("../../presentation/NotificationRow.tsx", import.meta.url),
    name => name.endsWith("model/presentation") ? { notificationHref, notificationTime } : undefined);
  const path = "/testcases/umbrella-home/work/?workspaceId=workspace_umbrella_home&projectId=p&view=cases&caseId=c";
  const item = { id: "event", category: "cases", action: "test_case.updated", title: "Test case updated", body: "QA-TC-1",
    read: false, createdAt: "2026-09-29T00:00:00Z", url: `https://umbrella-falcon.saturnusgo.com${path}` } as NotificationItem;
  const output = nodes(h.render(() => Row({ item, locale: "en", workspaceId: "workspace_umbrella_home",
    pageUrl: `https://tms.saturnusgo.com${path}`, onRead: id => reads.push(id), onNavigate: href => navigations.push(href) })));
  const anchor = output.find(node => node.type === "a"); assert.ok(anchor);
  assert.equal(anchor.props.href, `https://tms.saturnusgo.com${path}`);
  let prevented = false; invoke(anchor, "onClick", { button: 0, preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.deepEqual(reads, ["event"]); assert.deepEqual(navigations, [`https://tms.saturnusgo.com${path}`]); h.dispose();
});
