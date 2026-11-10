import assert from "node:assert/strict";
import { test } from "node:test";
import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import { utils, write } from "xlsx";
import { columnName, getFilePreviewKind } from "../model/file-preview-format";
import { parseFilePreview } from "../worker/file-preview-parser";

test("PDFs route to the embedded renderer and active content remains plain text", () => {
  assert.equal(getFilePreviewKind("release.PDF", "application/octet-stream"), "pdf");
  assert.equal(getFilePreviewKind("report", "application/pdf"), "pdf");
  assert.equal(getFilePreviewKind("preview.svg", "image/svg+xml"), "text");
  assert.equal(getFilePreviewKind("preview.html", "text/html"), "text");
  assert.equal(getFilePreviewKind("preview.exe", "application/octet-stream"), "unsupported");
});

for (const bookType of ["xlsx", "biff8"] as const) {
  test(`workbook preview preserves sheets and displays cached formula values (${bookType})`, async () => {
    const workbook = utils.book_new();
    const services = utils.aoa_to_sheet([["Service", "Total"], ["Cleaning", 10]]);
    services.B2 = { t: "n", v: 10, f: "5+5" };
    utils.book_append_sheet(workbook, services, "Services");
    utils.book_append_sheet(workbook, utils.aoa_to_sheet([["Booking"]]), "Categories");
    const filename = bookType === "xlsx" ? "catalog.xlsx" : "catalog.xls";
    const blob = new Blob([write(workbook, { bookType, type: "array" })]);
    const result = await parseFilePreview({ kind: "sheet", filename, blob });
    assert.equal(result.kind, "sheet");
    assert.deepEqual(result.sheets.map(sheet => sheet.name), ["Services", "Categories"]);
    assert.equal(result.sheets[0].cells[1][0].text, "Cleaning");
    assert.equal(result.sheets[0].cells[1][1].text, "10");
    if (bookType === "xlsx") assert.equal(result.sheets[0].cells[1][1].formula, "5+5");
    assert.equal(result.sheets[1].cells[0][0].text, "Booking");
    assert.equal(result.limited, false);
  });
}

test("CSV treats formula-like entries as text and preserves spreadsheet addresses", async () => {
  const result = await parseFilePreview({
    kind: "sheet", filename: "service.csv", blob: new Blob(["Service,Code\nCleaning,=1+1"]),
  });
  assert.equal(result.kind, "sheet");
  assert.deepEqual(result.sheets[0].cells[1][1], { text: "=1+1", formula: undefined });
  assert.deepEqual([0, 25, 26, 255].map(columnName), ["A", "Z", "AA", "IV"]);
});

test("ZIP preview lists entries without opening their contents", async () => {
  const writer = new ZipWriter(new BlobWriter(), { useWebWorkers: false });
  await writer.add("reports/", undefined, { directory: true });
  await writer.add("reports/notes.txt", new TextReader("hello"));
  const result = await parseFilePreview({ kind: "archive", filename: "reports.zip", blob: await writer.close() });
  assert.deepEqual(result, { kind: "archive", limited: false, entries: [
    { name: "reports/", size: 0, directory: true },
    { name: "reports/notes.txt", size: 5, directory: false },
  ] });
});

test("text preview bounds the amount read", async () => {
  const result = await parseFilePreview({
    kind: "text", filename: "build.log", blob: new Blob(["x".repeat(600 * 1024)]),
  });
  assert.equal(result.kind, "text");
  assert.equal(result.text.length, 512 * 1024);
  assert.equal(result.limited, true);
});
