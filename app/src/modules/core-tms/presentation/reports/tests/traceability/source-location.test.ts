import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { DefectSourceLocation } from "../../detail/properties/source/DefectSourceLocation";

test("recorded breadcrumb retains its path while opening the current location", t => {
  const h = componentHarness(); t.after(() => h.dispose()); let opened = 0;
  const { DefectSourceLocation: View } = h.load<{ DefectSourceLocation: typeof DefectSourceLocation }>(new URL("../../detail/properties/source/DefectSourceLocation.tsx", import.meta.url));
  const location = { folderId: "stable-folder", folderPath: "/Original/Payments", capturedAt: "2026-11-13T00:00:00Z", origin: "run" as const };
  const tree = nodes(h.render(() => View({ location, ru: false, onOpen: () => { opened++; } })));
  assert.equal(tree.find(node => node.type === "FolderPathBreadcrumb")?.props.path, "/Original/Payments");
  invoke(tree.find(node => node.type === "Button")!, "onPress"); assert.equal(opened, 1);
  const pending = nodes(h.render(() => View({ location, ru: false, onOpen() {}, pending: true, error: "Folder unavailable" })));
  assert.equal(pending.find(node => node.type === "Button")?.props.isDisabled, true);
  assert.equal(pending.find(node => node.type === "FolderPathBreadcrumb")?.props.path, location.folderPath);
  assert.ok(pending.some(node => node.props.role === "status" && node.props.children === "Folder unavailable"));
});

test("legacy missing folder never turns into a project-root breadcrumb", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const { DefectSourceLocation: View } = h.load<{ DefectSourceLocation: typeof DefectSourceLocation }>(new URL("../../detail/properties/source/DefectSourceLocation.tsx", import.meta.url));
  const tree = nodes(h.render(() => View({ location: null, ru: true })));
  assert.ok(tree.some(node => node.props.children === "Не сохранена"));
  assert.ok(!tree.some(node => node.type === "FolderPathBreadcrumb" || node.type === "Button"));
});
