import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes } from "../../../../../portfolios/tests/support/component-harness";
import type { SuiteFolderPath } from "../SuiteFolderPath";

test("folder paths render named segments and preserve the complete normalized path for inspection", () => {
  const h = componentHarness();
  const { SuiteFolderPath: View } = h.load<{ SuiteFolderPath: typeof SuiteFolderPath }>(new URL("../SuiteFolderPath.tsx", import.meta.url));
  const all = nodes(View({ path: "//Host///Calendar/", ru: false }));
  assert.equal(all[0].props.title, "/Host/Calendar");
  assert.deepEqual(all.filter(node => node.props["data-folder-segment"]).map(node => node.props.children), ["Host", "Calendar"]);
  assert.equal(all.filter(node => node.type === "PiCaretRight").length, 1);
  assert.equal(all.find(node => node.type === "FolderVisual")?.props.path, "//Host///Calendar/");
  assert.equal(all.some(node => node.props.children === "/"), false); h.dispose();
});
test("root and unavailable folder identities are distinct in both languages", () => {
  const h = componentHarness();
  const { SuiteFolderPath: View } = h.load<{ SuiteFolderPath: typeof SuiteFolderPath }>(new URL("../SuiteFolderPath.tsx", import.meta.url));
  for (const ru of [false, true]) {
    const root = nodes(View({ path: "/", ru }));
    assert.equal(root[0].props.title, "/");
    assert.equal(root.some(node => node.props.children === (ru ? "Без папки" : "Unfiled")), true);
    const unavailable = nodes(View({ path: "/Old folder", ru, unavailable: true }));
    assert.equal(unavailable[0].props["data-unavailable"], true);
    assert.equal(unavailable.some(node => node.props.children === (ru ? "Папка недоступна" : "Folder unavailable")), true);
    assert.equal(String(unavailable[0].props.title).includes("/Old folder"), true);
    assert.equal(unavailable.some(node => node.props["data-folder-segment"]), false);
  }
  h.dispose();
});
