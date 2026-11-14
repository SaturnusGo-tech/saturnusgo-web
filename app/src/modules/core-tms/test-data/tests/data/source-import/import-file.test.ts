import test from "node:test";
import assert from "node:assert/strict";
import { File } from "node:buffer";
import { utils, write } from "xlsx";
import { readSourceImportFile } from "../../../data/source-import/read-source-import-file";

test("spreadsheet import offers every populated sheet and preserves formulas as literal data", async () => {
  const book = utils.book_new();
  utils.book_append_sheet(book, utils.aoa_to_sheet([["email", "amount"], ["qa@example.test", "9007199254740993.01"]]), "Customers");
  const formulas = utils.aoa_to_sheet([["value"], ["ignored"]]); formulas.A2 = { t: "n", v: 2, f: "1+1" };
  utils.book_append_sheet(book, formulas, "Boundaries");
  const result = await readSourceImportFile(new File([write(book, { type: "buffer", bookType: "xlsx" })], "customers.xlsx") as unknown as globalThis.File, new AbortController().signal);
  assert.equal(result.format, "CSV"); assert.deepEqual(result.sheets.map(sheet => sheet.name), ["Customers", "Boundaries"]);
  assert.match(result.sheets[0].content, /9007199254740993.01/); assert.match(result.sheets[1].content, /=1\+1/);
});
test("CSV content is unchanged; cancellation and unsupported files fail before importing", async () => {
  const file = new File(["email,amount\nqa@example.test,0.01"], "customers.csv") as unknown as globalThis.File;
  const result = await readSourceImportFile(file, new AbortController().signal); assert.equal(result.sheets[0].content, await file.text());
  const controller = new AbortController(); controller.abort();
  await assert.rejects(readSourceImportFile(file, controller.signal), { name: "AbortError" });
  await assert.rejects(readSourceImportFile(new File(["x"], "unknown.exe") as unknown as globalThis.File, new AbortController().signal));
});
