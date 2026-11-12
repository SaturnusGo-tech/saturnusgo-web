import assert from "node:assert/strict";
import { test } from "node:test";
import { desktopNotificationCommand } from "../../domain/native/desktop-notification-command";
test("advanced notification windows require an explicitly capable Falcon release", () => {
  assert.equal(desktopNotificationCommand("workspace", "notifications", "Mozilla FalconDesktop/0.2.11"), null);
  assert.equal(desktopNotificationCommand("workspace", "notifications", "Mozilla Electron/45.2.2"), null);
  assert.equal(desktopNotificationCommand("workspace", "notifications", "Mozilla FalconDesktop/0.2.12"), "falcon://preferences/notifications?workspaceId=workspace");
  assert.equal(desktopNotificationCommand("workspace", "notification-permission", "Mozilla FalconDesktop/1.0.0"), "falcon://preferences/notification-permission?workspaceId=workspace");
});
test("untrusted workspace data cannot change the native command", () => {
  for (const id of ["", "../other", "w&url=evil", "w#injected", "a".repeat(129)])
    assert.equal(desktopNotificationCommand(id, "notifications", "FalconDesktop/0.2.12"), null);
});
