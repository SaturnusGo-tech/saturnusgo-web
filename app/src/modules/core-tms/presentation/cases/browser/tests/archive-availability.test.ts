import assert from "node:assert/strict";
import test from "node:test";
import { browserHarness, elements } from "./browser-harness";

const archiveButton = (tree: unknown) => elements(tree, item => item.props["aria-label"] === "Show archived folders");

test("repository hides the archive control when the project has no archived folders or cases", () => {
  const app = browserHarness();
  app.props.folders!.items = app.props.folders!.items.filter(folder => !folder.archivedAt);
  app.props.testCases = app.items.filter(item => !item.archivedAt);
  assert.equal(archiveButton(app.renderTree()).length, 0);
  app.dispose();
});

test("an archived case keeps the archive available even when current filters match nothing", () => {
  const app = browserHarness();
  app.props.folders!.items = app.props.folders!.items.filter(folder => !folder.archivedAt);
  app.props.query = "no matching cases";
  assert.equal(archiveButton(app.renderTree()).length, 1);
  app.dispose();
});

test("restoring the last archived item leaves archive mode and removes the control", () => {
  const app = browserHarness();
  (archiveButton(app.renderTree())[0].props.onClick as () => void)();
  app.renderTree();
  assert.equal(archiveButton(app.renderTree())[0].props["aria-pressed"], true);
  app.props.folders!.items = app.props.folders!.items.filter(folder => !folder.archivedAt);
  app.props.testCases = app.items.filter(item => !item.archivedAt);
  const tree = app.renderTree();
  assert.equal(archiveButton(tree).length, 0);
  assert.ok(elements(tree, item => item.type === "span" && item.props.children === "Folders").length);
  app.dispose();
});
