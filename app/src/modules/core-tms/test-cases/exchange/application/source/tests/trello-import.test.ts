import test from "node:test";
import assert from "node:assert/strict";
import { decodeImportFile } from "../decode-import-file";
const board = () => ({ id: "b1", name: "Aurora/Қазақша", cards: [
  { id: "c1", name: "Reconnect 🔐", desc: "Keep **Markdown**.\nNo expected result.", idList: "l1", idChecklists: ["k1"], closed: false, customFieldItems: [{ id: "cf1", value: { text: "do not lose" } }] },
  { id: "c2", name: "Manual procedure", desc: "Open Settings.", idList: "l1", idChecklists: [], closed: true },
], lists: [{ id: "l1", name: "Connections\\OAuth", closed: false }], checklists: [
  { id: "k1", idCard: "c1", name: "Provider flow", pos: 1, checkItems: [
    { id: "i2", name: "Select Reconnect", state: "incomplete", pos: 2, due: null },
    { id: "i1", name: "Open Settings", state: "complete", pos: 1, idMember: "u1" },
  ] },
] });
const decode = (source: unknown) => decodeImportFile(new File([JSON.stringify(source)], "trello.json"));
test("Trello native board becomes source-backed checklist/manual cases with original metadata", async () => {
  const original = board(); const result = (await decode(original)).source as any;
  assert.equal(result.cases.length, 2);
  const [checklist, manual] = result.cases;
  assert.equal(checklist.sourceKey, "c1");
  assert.equal(checklist.title, "Reconnect 🔐");
  assert.equal(checklist.description, "Keep **Markdown**.\nNo expected result.");
  assert.equal(checklist.folderPath, "/Aurora／Қазақша/Connections＼OAuth");
  assert.equal(checklist.type, "checklist");
  assert.deepEqual(checklist.checklist, [{ order: 1, text: "Open Settings", required: true }, { order: 2, text: "Select Reconnect", required: true }]);
  assert.equal(checklist.steps, undefined);
  const metadata = JSON.parse(checklist.testData);
  assert.deepEqual(metadata.card.customFieldItems, [{ id: "cf1", value: { text: "do not lose" } }]);
  assert.equal(metadata.checklists[0].checkItems[1].state, "complete");
  assert.equal(metadata.checklists[0].checkItems[1].idMember, "u1");
  assert.equal(manual.type, "manual");
  assert.equal(manual.description, "Open Settings.");
  assert.deepEqual(manual.checklist, []);
  assert.equal(JSON.parse(manual.testData).card.closed, true);
});
test("Trello resolves ownership when card checklist IDs are omitted", async () => {
  const source = board(); delete (source.cards[0] as any).idChecklists;
  const result = (await decode(source)).source as any;
  assert.equal(result.cases[0].checklist.length, 2);
});
test("Trello rejects missing checklist/list references and unnamed cards instead of dropping source data", async () => {
  for (const mutate of [
    (b: any) => b.cards[0].idChecklists.push("missing"),
    (b: any) => b.checklists[0].idCard = "missing",
    (b: any) => b.cards[0].idList = "missing",
    (b: any) => b.cards[0].name = "",
    (b: any) => b.checklists[0].checkItems[0].name = null,
  ]) { const source = board(); mutate(source); await assert.rejects(decode(source), { code: "IMPORT_INVALID_PROVIDER" }); }
});
test("Trello rejects 501 checklist items before normalization", async () => {
  const source = board(); source.checklists[0].checkItems = Array.from({ length: 501 }, (_, i) => ({ id: `item-${i}`, name: `Item ${i}`, state: "incomplete", pos: i, due: null }));
  await assert.rejects(decode(source), { code: "IMPORT_LIMIT_EXCEEDED" });
});
test("generic JSON with unrelated cards stays unchanged", async () => {
  const source = { title: "Generic", cards: ["a", "b"] };
  assert.deepEqual((await decode(source)).source, source);
});
test("Trello rejects mixed present/missing positions instead of choosing an ambiguous checklist order", async () => {
  const source = board();
  (source.checklists[0] as any).checkItems = [{ name: "Last", pos: 3 }, { name: "Unknown" }, { name: "First", pos: 1 }];
  await assert.rejects(decode(source), { code: "IMPORT_INVALID_PROVIDER" });
  const groups = board();
  (groups.checklists as any[]).push({ id: "k2", idCard: "c1", name: "Unknown position", checkItems: [] });
  await assert.rejects(decode(groups), { code: "IMPORT_INVALID_PROVIDER" });
});
