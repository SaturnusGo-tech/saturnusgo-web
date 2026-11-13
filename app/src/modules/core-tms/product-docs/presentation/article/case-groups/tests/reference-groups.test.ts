import assert from "node:assert/strict";
import test from "node:test";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import type { Root } from "mdast";
import { remarkCaseReferences } from "../../../../../case-references/markdown/remarkCaseReferences";
import { remarkProductDocCaseGroups } from "../remarkProductDocCaseGroups";

const scope = { workspaceId: "team", projectId: "host" };
const current = "https://falcon.example/work/?workspaceId=team&projectId=host&view=product-docs";
function render(markdown: string) {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkCaseReferences)
    .use(remarkProductDocCaseGroups, { scope, current });
  return processor.runSync(processor.parse(markdown)) as Root;
}
function groups(node: unknown): Array<{ children: Array<{ url?: string }>; data: { hProperties?: { label?: string } } }> {
  if (!node || typeof node !== "object") return [];
  const value = node as { data?: { hName?: string }; children?: unknown[] };
  return [...(value.data?.hName === "falcon-case-group" ? [node as ReturnType<typeof groups>[number]] : []), ...(value.children?.flatMap(groups) ?? [])];
}

test("a reference-only paragraph groups exact case links in order and preserves the authored source", () => {
  const source = "HOST-TC-1; HOST-TC-2, **HOST-TC-3**; HOST-TC-4.";
  const grouped = groups(render(source));
  assert.equal(grouped.length, 1);
  assert.deepEqual(grouped[0].children.map(link => link.url), [1, 2, 3, 4].map(id => `#falcon-case-key=HOST-TC-${id}`));
  assert.equal(source, "HOST-TC-1; HOST-TC-2, **HOST-TC-3**; HOST-TC-4.");
});

test("source labels stay separate from the reference rows in English and Russian", () => {
  for (const label of ["Sources", "Источники", "Related cases", "Связанные кейсы"]) {
    const grouped = groups(render(`${label}: HOST-TC-1; HOST-TC-2`));
    assert.equal(grouped.length, 1);
    assert.equal(grouped[0].data.hProperties?.label, label);
  }
});

test("table cells can group references without changing the first group column or mixed prose", () => {
  const tree = render("| Group | Cases |\n| --- | --- |\n| Payments | HOST-TC-1; HOST-TC-2; HOST-TC-3; HOST-TC-4 |\n| Recovery | Compare HOST-TC-5 with the retry contract. |");
  assert.equal(groups(tree).length, 1);
  const table = tree.children[0];
  assert.equal(table.type, "table");
  if (table.type === "table") assert.equal((table.children[1].children[0].children[0] as { value: string }).value, "Payments");
});

test("mixed sentences, code, ordinary links and unresolved single mentions keep their authored structure", () => {
  for (const source of ["Read HOST-TC-1 and confirm HOST-TC-2 before release.", "`HOST-TC-1; HOST-TC-2`", "HOST-TC-1", "[External](https://elsewhere.example/?caseId=a); HOST-TC-2", "HOST-TC-1 — expected failure; HOST-TC-2 — recovery"]) {
    assert.equal(groups(render(source)).length, 0, source);
  }
});

test("explicit same-workspace case links group while documents and outside-workspace links do not", () => {
  const url = (id: string, workspace = "team") => `/work/?workspaceId=${workspace}&projectId=host&view=cases&caseId=${id}`;
  assert.equal(groups(render(`[One](${url("one")}); [Two](${url("two")})`)).length, 1);
  assert.equal(groups(render(`[One](${url("one", "other")}); [Two](${url("two")})`)).length, 0);
  assert.equal(groups(render(`[Document](/work/?workspaceId=team&projectId=host&view=product-docs&docId=doc); HOST-TC-2`)).length, 0);
});
