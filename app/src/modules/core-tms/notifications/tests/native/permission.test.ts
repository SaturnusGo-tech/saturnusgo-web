import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes, invoke } from "../../../portfolios/tests/support/component-harness";
import type { DesktopNotifications } from "../../presentation/native/DesktopNotifications";
test("Electron can request first-session permission even when its initial status is denied", async () => {
  let requests = 0;
  const h = componentHarness(undefined, { Notification: { permission: "denied", requestPermission: async () => { requests++; return "granted"; } } });
  const { DesktopNotifications: render } = h.load<{ DesktopNotifications: typeof DesktopNotifications }>(new URL("../../presentation/native/DesktopNotifications.tsx", import.meta.url), name => name.endsWith("desktop-notification-command") ? { desktopNotificationCommand: () => null } : undefined);
  const draw = () => nodes(h.render(() => render({ ru: false })));
  const button = draw().find(n => n.type === "Button" && n.props.children === "Allow notifications");
  assert.ok(button, "initial denied in Electron must not remove its explicit permission action");
  invoke(button, "onPress"); await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(requests, 1);
  assert.equal(draw().some(n => n.props.children === "Notifications are allowed for this Falcon session."), true, JSON.stringify(draw().filter(n => n.type === "p")));
});
