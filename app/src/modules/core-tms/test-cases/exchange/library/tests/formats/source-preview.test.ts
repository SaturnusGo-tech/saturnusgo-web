import test from "node:test";
import assert from "node:assert/strict";
import { utils, write } from "xlsx";
import { readImportFile } from "../../data/read-import-file";
import type { PrivateAttachmentClient } from "../../../../../attachments/application/private-attachment-client";

const signal = new AbortController().signal;
const client = { createAccess: async () => ({ url: "https://private.example/original" }) } as unknown as PrivateAttachmentClient;

for (const bookType of ["xlsx", "biff8"] as const) {
  test(`${bookType} history previews actual sheet cells while preserving the downloaded original bytes`, async t => {
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([["Title", "Comment", "Comment", "Value"],
      ["Қазақша", "Line 1\nLine 2", "=1+1", false], ["Second", "", "literal", 0]]), "Original sheet");
    const bytes = new Uint8Array(write(workbook, { type: "array", bookType }));
    const original = bytes.slice();
    t.mock.method(globalThis, "fetch", async () => new Response(bytes));
    const text = await readImportFile(client, "original", signal, bookType === "xlsx" ? "cases.xlsx" : "cases.xls");
    assert.deepEqual(JSON.parse(text), { sheets: [{ name: "Original sheet",
      headers: ["Title", "Comment", "Comment", "Value"], rows: [
        ["Қазақша", "Line 1\nLine 2", "=1+1", false], ["Second", "", "literal", 0],
      ] }] });
    assert.deepEqual(bytes, original);
  });
}

test("JSON stays formatted and delimited source previews preserve authored line endings", async t => {
  let body = '\ufeff{ "title": "Қазақша" }';
  t.mock.method(globalThis, "fetch", async () => new Response(body));
  assert.equal(await readImportFile(client, "json", signal, "cases.json"), '{\n  "title": "Қазақша"\n}');
  body = 'Title,Description\r\nCase,"Line 1\r\nLine 2"\r\n';
  assert.equal(await readImportFile(client, "csv", signal, "cases.csv"), body);
});

test("older JSON originals retain raw text when formatting would change a numeric value or discard a field", async t => {
  let body = "";
  t.mock.method(globalThis, "fetch", async () => new Response(body));
  for (const original of [' {"id":9007199254740993}\n', '{"value":0.10000000000000001}', '{"title":"First","title":"Second"}']) {
    body = original;
    assert.equal(await readImportFile(client, "legacy", signal, "older.json"), original);
  }
});

test("preview byte limits and cancellation are checked before decoding content", async t => {
  t.mock.method(globalThis, "fetch", async () => new Response(new Uint8Array(5_000_001)));
  await assert.rejects(readImportFile(client, "oversized", signal, "cases.xlsx"), /FILE_TOO_LARGE/);
  const abort = new AbortController();
  t.mock.method(globalThis, "fetch", async () => { abort.abort(); return new Response("invalid workbook"); });
  await assert.rejects(readImportFile(client, "cancelled", abort.signal, "cases.xlsx"), { name: "AbortError" });
});
