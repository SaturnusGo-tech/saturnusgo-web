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
  assert.equal(getFilePreviewKind("config", "application/problem+json"), "text");
  for (const name of ["README", "Dockerfile", "Makefile", ".gitignore", ".env.example", "scripts/worker.mjs", "report.ndjson"]) {
    assert.equal(getFilePreviewKind(name, "application/octet-stream"), "text", name);
  }
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

test("ZIP preview lists safe paths and indicates which files can be opened", async () => {
  const writer = new ZipWriter(new BlobWriter(), { useWebWorkers: false });
  await writer.add("reports/", undefined, { directory: true });
  await writer.add("reports/notes.txt", new TextReader("hello"));
  await writer.add("reports/raw.bin", new TextReader("binary"));
  await writer.add("../escape.ts", new TextReader("escape"));
  const result = await parseFilePreview({ kind: "archive", filename: "reports.zip", blob: await writer.close() });
  assert.deepEqual(result, { kind: "archive", limited: false, entries: [
    { name: "reports/", size: 0, directory: true },
    { name: "reports/notes.txt", size: 5, directory: false, previewable: true },
    { name: "reports/raw.bin", size: 6, directory: false },
  ] });
});

test("ZIP extracts only the selected source file, with slash-normalized paths", async () => {
  const writer = new ZipWriter(new BlobWriter(), { useWebWorkers: false });
  await writer.add("./src/first.ts", new TextReader("const first = true;"));
  await writer.add("src/nested/second.ts", new TextReader("const second = true;"));
  await writer.add("build/output.bin", new TextReader("not source"));
  const blob = await writer.close();
  assert.deepEqual(await parseFilePreview({ kind: "archive-entry", filename: "src/first.ts", blob }), {
    kind: "text", text: "const first = true;", limited: false,
  });
  await assert.rejects(parseFilePreview({ kind: "archive-entry", filename: "build/output.bin", blob }));
  await assert.rejects(parseFilePreview({ kind: "archive-entry", filename: "src/missing.ts", blob }));
});

test("ZIP bounds work for very large entries and truncates medium text entries", async () => {
  const writer = new ZipWriter(new BlobWriter(), { useWebWorkers: false });
  await writer.add("long.log", new TextReader("x".repeat(600 * 1024)));
  await writer.add("huge.log", new TextReader("y".repeat(4 * 1024 * 1024 + 1)));
  const blob = await writer.close();
  const list = await parseFilePreview({ kind: "archive", filename: "logs.zip", blob });
  assert.equal(list.kind, "archive");
  assert.equal(list.entries[0].previewable, true);
  assert.equal(list.entries[1].previewable, undefined);
  const result = await parseFilePreview({ kind: "archive-entry", filename: "long.log", blob });
  assert.equal(result.kind, "text");
  assert.equal(result.text.length, 512 * 1024);
  assert.equal(result.limited, true);
  await assert.rejects(parseFilePreview({ kind: "archive-entry", filename: "huge.log", blob }));
});

test("ZIP does not open encrypted files, symlinks, or entries with an invalid checksum", async () => {
  const writer = new ZipWriter(new BlobWriter(), { useWebWorkers: false });
  await writer.add("locked.ts", new TextReader("locked"), { password: "fixture", zipCrypto: true });
  await writer.add("link.txt", new TextReader("../outside.txt"), { unixMode: 0o120777 });
  await writer.add("broken.txt", new TextReader("invalidate this content"), { level: 0 });
  const bytes = Buffer.from(await (await writer.close()).arrayBuffer());
  const storedContent = bytes.indexOf("invalidate this content");
  assert.ok(storedContent > -1);
  bytes[storedContent] ^= 1;
  const blob = new Blob([bytes]);
  const list = await parseFilePreview({ kind: "archive", filename: "source.zip", blob });
  assert.equal(list.kind, "archive");
  assert.deepEqual(list.entries.map(entry => entry.previewable), [undefined, undefined, true]);
  for (const filename of ["locked.ts", "link.txt", "broken.txt"]) {
    await assert.rejects(parseFilePreview({ kind: "archive-entry", filename, blob }));
  }
});

test("formats JSON without changing numbers, property order, duplicate keys, or strings", async () => {
  const text = String.raw`{"3":9007199254740993,"1":1.0,"key":"a,b:[\u0020]","key":[{},[]]}`;
  const formatted = '{\n  "3": 9007199254740993,\n  "1": 1.0,\n  "key": "a,b:[\\u0020]",\n  "key": [\n    {},\n    []\n  ]\n}';
  const file = await parseFilePreview({ kind: "text", filename: "payload.json", blob: new Blob([text]) });
  assert.deepEqual(file, { kind: "text", text: formatted, limited: false });
  const writer = new ZipWriter(new BlobWriter(), { useWebWorkers: false });
  await writer.add("nested/payload.json", new TextReader(text));
  const archiveFile = await parseFilePreview({ kind: "archive-entry", filename: "nested/payload.json", blob: await writer.close() });
  assert.deepEqual(archiveFile, file);
});

test("formats extensionless JSON with a declared media type and preserves BOM-marked UTF-16 text", async () => {
  const json = await parseFilePreview({
    kind: "text", filename: "response", mimeType: "application/problem+json; charset=utf-8",
    blob: new Blob(['{"status":400}']),
  });
  assert.deepEqual(json, { kind: "text", text: '{\n  "status": 400\n}', limited: false });
  const utf16 = await parseFilePreview({
    kind: "text", filename: "note.txt", blob: new Blob([Buffer.from("\uFEFFПривет", "utf16le")]),
  });
  assert.deepEqual(utf16, { kind: "text", text: "Привет", limited: false });
});

test("malformed JSON and JSON lines retain their original contents", async () => {
  for (const [filename, text] of [["broken.json", '{"invalid":true,}'], ["events.jsonl", '{"ok":true}\n{"ok":false}']]) {
    const file = await parseFilePreview({ kind: "text", filename, blob: new Blob([text]) });
    assert.deepEqual(file, { kind: "text", text, limited: false });
  }
});

test("text preview bounds the amount read", async () => {
  const result = await parseFilePreview({
    kind: "text", filename: "build.log", blob: new Blob(["x".repeat(600 * 1024)]),
  });
  assert.equal(result.kind, "text");
  assert.equal(result.text.length, 512 * 1024);
  assert.equal(result.limited, true);
});
