import assert from "node:assert/strict";
import { test } from "node:test";
import type { NotificationInbox } from "../../presentation/NotificationInbox";
import type { NotificationInboxState } from "../../application/useNotificationInbox";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";

for (const fallback of [false, true]) test(`the ${fallback ? "portaled fallback" : "native"} panel exposes one labelled dialog and its correct display mode`, () => {
  const h = componentHarness();
  const { NotificationInbox: Panel } = h.load<{ NotificationInbox: typeof NotificationInbox }>(new URL("../../presentation/NotificationInbox.tsx", import.meta.url));
  const output = nodes(h.render(() => Panel({ panel: { current: null }, id: "inbox", fallback,
    model: { items: [], unreadCount: 0, loading: false, busy: false, error: false, next: null } as unknown as NotificationInboxState,
    locale: "en", workspaceId: "w", pageUrl: "https://tms.saturnusgo.com/testcases/umbrella-home/work/?workspaceId=w",
    onClose() {}, onNavigate() {}, onSettings() {},
  })));
  const dialogs = output.filter(node => node.props.role === "dialog"); assert.equal(dialogs.length, 1);
  assert.equal(dialogs[0].props.popover, fallback ? undefined : "manual");
  assert.equal(dialogs[0].props["aria-labelledby"], "inbox-title");
  assert.equal(output.find(node => node.type === "h2")?.props.id, "inbox-title"); h.dispose();
});
