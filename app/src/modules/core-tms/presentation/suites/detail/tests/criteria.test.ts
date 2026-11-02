import assert from "node:assert/strict";
import test from "node:test";
import type { Suite } from "../../../../../../core/tms/contracts/legacy-contract";
import type { RepositoryFolder } from "../../../../folders/model/folder";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { SuiteCriteria } from "../SuiteCriteria";

const suite = { projectId: "p", type: "dynamic", filter: { folderId: "f", folderPathPrefix: "/Old name", tags: ["smoke", "billing"], priority: ["high"], lifecycle: ["ready"], text: "settlement" } } as Suite;
test("dynamic criteria keep all saved rules and use existing folder, lifecycle and priority semantics", () => {
  const h = componentHarness();
  const { SuiteCriteria: View } = h.load<{ SuiteCriteria: typeof SuiteCriteria }>(new URL("../SuiteCriteria.tsx", import.meta.url));
  const folders = [{ id: "f", projectId: "p", path: "/Host/Payments", archivedAt: null }] as RepositoryFolder[];
  const all = nodes(View({ suite, folders, ru: false }));
  assert.equal(all.find(node => node.type === "SuiteFolderPath")!.props.path, "/Host/Payments");
  assert.equal(all.find(node => node.type === "SuiteFolderPath")!.props.unavailable, false);
  assert.equal(all.find(node => node.type === "PrioritySignal")!.props.priority, "high");
  assert.equal(all.find(node => node.type === "LifecycleBadge")!.props.lifecycle, "ready");
  assert.equal(all.some(node => node.props.children === "#smoke"), true);
  assert.equal(all.some(node => node.props.children === "#billing"), true);
  assert.equal(all.some(node => node.props.children === "Includes subfolders"), true);
  assert.equal(all.some(node => String(node.props.children).includes("settlement")), true); h.dispose();
});
test("a missing or archived folder ID never masquerades as an active same-path folder", () => {
  const h = componentHarness();
  const { SuiteCriteria: View } = h.load<{ SuiteCriteria: typeof SuiteCriteria }>(new URL("../SuiteCriteria.tsx", import.meta.url));
  const folders = [{ id: "f", projectId: "foreign", path: "/Wrong" }, { id: "replacement", projectId: "p", path: "/Old name" }] as RepositoryFolder[];
  const all = nodes(View({ suite, folders, ru: false }));
  const path = all.find(node => node.type === "SuiteFolderPath")!;
  assert.equal(path.props.unavailable, true); assert.equal(path.props.path, "/Old name");
  const manual = nodes(View({ suite: { ...suite, type: "static" }, folders, ru: false }));
  assert.equal(manual.some(node => node.type === "SuiteFolderPath" || node.type === "LifecycleBadge"), false);
  h.dispose();
});
