import assert from "node:assert/strict";
import test from "node:test";
import type { Table } from "mdast";
import { gfmTableToMarkdown } from "mdast-util-gfm-table";
import { toMarkdown } from "mdast-util-to-markdown";
import { parseProductDocTableClipboard } from "../editing/model/productDocTableClipboard";
import { applyProductDocTablePaste, canGrowProductDocTableOnTab } from "../editing/model/productDocTableEdits";

const table: Table = {
  type: "table", align: ["left", "center"], children: [
    { type: "tableRow", children: [
      { type: "tableCell", children: [{ type: "strong", children: [{ type: "text", value: "Case" }] }] },
      { type: "tableCell", children: [{ type: "text", value: "Status" }] },
    ] },
    { type: "tableRow", children: [
      { type: "tableCell", children: [{ type: "text", value: "Checkout" }] },
      { type: "tableCell", children: [{ type: "text", value: "Blocked" }] },
    ] },
  ],
};

test("reads Excel-style TSV, including CRLF, empty cells and quoted multiline cells", () => {
  assert.deepEqual(parseProductDocTableClipboard('ID\tDescription\tStatus\r\nQA-1\t"Run ""A""\r\nagain"\t\r\n'), [
    ["ID", "Description", "Status"], ["QA-1", 'Run "A" again', ""],
  ]);
  assert.deepEqual(parseProductDocTableClipboard("QA-1\nQA-2", true), [["QA-1"], ["QA-2"]]);
});

test("keeps prose and ragged or malformed input on the normal paste path", () => {
  assert.equal(parseProductDocTableClipboard("A single column of prose\nWith a line break"), null);
  assert.equal(parseProductDocTableClipboard("A\tB\nC"), null);
  assert.equal(parseProductDocTableClipboard('A\t"Unfinished'), null);
  assert.equal(parseProductDocTableClipboard(Array.from({ length: 60 }, () => "1\t".repeat(12) + "2").join("\n")), null);
});

test("spreads a pasted range from the active cell without changing nearby cells or column alignment", () => {
  const edited = applyProductDocTablePaste(table, 1, 1, [["A | B", "Pass"], ["Pending", ""]]);
  assert.ok(edited);
  assert.deepEqual(edited.align, ["left", "center"]);
  assert.deepEqual(edited.children[0].children[0], table.children[0].children[0]);
  assert.deepEqual(edited.children[1].children[0], table.children[1].children[0]);
  assert.equal(edited.children.length, 3);
  assert.ok(edited.children.every((row) => row.children.length === 3));
  assert.equal(table.children[1].children[1].children[0].type === "text" && table.children[1].children[1].children[0].value, "Blocked");
  assert.match(toMarkdown({ type: "root", children: [edited] }, { extensions: [gfmTableToMarkdown()] }), /A \\\| B/);
});

test("Tab can grow a populated last row and leaves an empty last row or a capped table", () => {
  assert.equal(canGrowProductDocTableOnTab({ rows: 3, columns: 4, row: 2, column: 3, lastRowHasContent: true }), true);
  assert.equal(canGrowProductDocTableOnTab({ rows: 3, columns: 4, row: 2, column: 3, lastRowHasContent: false }), false);
  assert.equal(canGrowProductDocTableOnTab({ rows: 3, columns: 4, row: 2, column: 2, lastRowHasContent: true }), false);
  assert.equal(canGrowProductDocTableOnTab({ rows: 60, columns: 4, row: 59, column: 3, lastRowHasContent: true }), false);
});
