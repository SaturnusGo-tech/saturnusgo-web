import test from "node:test";
import assert from "node:assert/strict";
import { utils, write } from "xlsx";
import { BlobWriter, TextReader, ZipWriter } from "@zip.js/zip.js";
import { decodeImportFile } from "../decode-import-file";

const file = (text: string | Uint8Array, name: string) => new File([text as BlobPart], name);

test("JSON decoding preserves authored strings and uses the original text", async () => {
  const decoded = await decodeImportFile(file('{"cases":[{"title":" Қазақша ","value":false,"n":0}]}', "cases.json"));
  assert.deepEqual(decoded.source, { cases: [{ title: " Қазақша ", value: false, n: 0 }] });
  assert.equal(decoded.nativeText, '{"cases":[{"title":" Қазақша ","value":false,"n":0}]}');
  assert.equal(decoded.mimeType, "application/json");
});
test("CSV preserves multiline quoted cells, repeated headers, and literal formulas", async () => {
  const decoded = await decodeImportFile(file('ID,Title,Description,Comment,Comment\r\nWEB-1,"Reconnect, now","Line 1\r\nLine 2",first,"=1+1"\r\n', "linear.csv"));
  const source = decoded.source as any;
  assert.equal(source.format, "csv");
  assert.deepEqual(source.sheets[0].headers, ["ID", "Title", "Description", "Comment", "Comment"]);
  assert.equal(source.sheets[0].cases[0].title, "Reconnect, now");
  assert.equal(source.sheets[0].cases[0].description, "Line 1\r\nLine 2");
  assert.deepEqual(source.sheets[0].cases[0].Comment, ["first", "=1+1"]);
  assert.deepEqual(source.sheets[0].cases[0].sourceColumns.slice(3), [{ name: "Comment", value: "first" }, { name: "Comment", value: "=1+1" }]);
  assert.equal(decoded.mimeType, "text/plain");
});
test("TSV keeps tab-separated columns and semicolon CSV is detected", async () => {
  for (const [name, body] of [["cases.tsv", "Title\tDescription\nReconnect\tОткрыть настройки"], ["cases.csv", "Title;Description\nReconnect;Открыть настройки"]]) {
    const source = (await decodeImportFile(file(body, name))).source as any;
    assert.equal(source.sheets[0].cases[0].description, "Открыть настройки");
  }
});
test("CSV rejects malformed quotes, width mismatches, no records, and 2001 rows", async () => {
  for (const body of ['Title,Description\n"Unclosed,description', 'Title,Description\nA,B,C', 'Title,Description\n', 'Title\n' + Array.from({ length: 2001 }, (_, i) => `Case ${i}`).join('\n')]) {
    await assert.rejects(decodeImportFile(file(body, "cases.csv")));
  }
});
test("text imports reject invalid UTF-8 rather than replacing authored bytes", async () => {
  await assert.rejects(decodeImportFile(file(new Uint8Array([0x7b, 0x22, 0xc3, 0x28]), "cases.json")), /UTF-8/);
});
test("file size is checked before reading text", async () => {
  await assert.rejects(decodeImportFile(file("x".repeat(5_000_001), "cases.json")), /5|limit|LIMIT/i);
});
test("XML retains TestRail hierarchy, repeated case nodes, entity text and custom data", async () => {
  const xml = '<suite><id>S1</id><name>Aurora</name><sections><section><name>Users &amp; Roles</name><cases><case><id>C1</id><title>First</title><custom><preconds> A\nB </preconds><automation_type><id>0</id><value>false</value></automation_type></custom></case><case><id>C2</id><title>Second</title></case></cases></section></sections></suite>';
  const decoded = await decodeImportFile(file(xml, "testrail.xml"));
  const source = decoded.source as any;
  assert.equal(source.suite.sections.section.name, "Users & Roles");
  assert.equal(source.suite.sections.section.cases.case.length, 2);
  assert.equal(source.suite.sections.section.cases.case[0].custom.preconds, " A\nB ");
  assert.equal(source.suite.sections.section.cases.case[0].custom.automation_type.value, "false");
  assert.equal(source.suite.sections.section.cases.case[0].custom.automation_type.id, "0");
  assert.equal(decoded.nativeText, xml);
});
test("XML rejects malformed structure and declarations capable of entity expansion", async () => {
  for (const body of ['<suite><case></suite>', '<!DOCTYPE suite [<!ENTITY x "bad">]><suite>&x;</suite>', '<!ENTITY x SYSTEM "file:///etc/passwd"><suite/>']) {
    await assert.rejects(decodeImportFile(file(body, "cases.xml")));
  }
});
for (const bookType of ["xlsx", "biff8"] as const) {
  test(`${bookType} keeps sheet context and duplicate columns without evaluating formulas`, async () => {
    const workbook = utils.book_new();
    const sheet = utils.aoa_to_sheet([["Title", "Comment", "Comment"], ["Қазақша", "first", "second"]]);
    sheet.D1 = { t: "s", v: "Formula" }; sheet.D2 = bookType === "xlsx" ? { t: "n", v: 2, f: "1+1" } : { t: "s", v: "=1+1" }; sheet["!ref"] = "A1:D2";
    utils.book_append_sheet(workbook, sheet, "Connections");
    const bytes = write(workbook, { type: "array", bookType });
    const decoded = await decodeImportFile(file(new Uint8Array(bytes), bookType === "xlsx" ? "cases.xlsx" : "cases.xls"));
    const source = decoded.source as any;
    assert.equal(source.sheets[0].name, "Connections");
    assert.equal(source.sheets[0].cases[0].title, "Қазақша");
    assert.deepEqual(source.sheets[0].cases[0].Comment, ["first", "second"]);
    assert.equal(source.sheets[0].cases[0].Formula, "=1+1");
    assert.equal(decoded.mimeType, "application/octet-stream");
  });
}
test("workbooks reject inflated ZIP data before SheetJS parsing", async () => {
  const writer = new ZipWriter(new BlobWriter());
  await writer.add("xl/huge.xml", new TextReader("x".repeat(20_000_001)), { useWebWorkers: false });
  const blob = await writer.close();
  await assert.rejects(decodeImportFile(new File([blob], "bomb.xlsx")), /limit|LIMIT/i);
});
test("unsupported formats are rejected instead of guessed as spreadsheets", async () => {
  await assert.rejects(decodeImportFile(file("Title\nCase", "cases.pdf")), { code: "IMPORT_UNSUPPORTED_FORMAT" });
  await assert.rejects(decodeImportFile(file("Title\nCase", "cases.xlsx")), /workbook|WORKBOOK|format|FORMAT/i);
});
test("prototype-like CSV header names remain inert source columns", async () => {
  const source = (await decodeImportFile(file('Title,__proto__,constructor\nSafe,value,other', 'safe.csv'))).source as any;
  const record = source.sheets[0].cases[0];
  assert.equal(record.__proto__, "value");
  assert.equal(record.constructor, "other");
  assert.deepEqual(record.sourceColumns, [{ name: "Title", value: "Safe" }, { name: "__proto__", value: "value" }, { name: "constructor", value: "other" }]);
  assert.equal(({} as any).polluted, undefined);
});
test("XML rejects undeclared entities and mixed content that an object tree would reorder", async () => {
  await assert.rejects(decodeImportFile(file('<suite><name>&undeclared;</name></suite>', 'bad.xml')));
  await assert.rejects(decodeImportFile(file('<suite><description>Before <b>bold</b> after.</description></suite>', 'mixed.xml')));
});
test("spreadsheet rows across sheets share the 2000-record limit", async () => {
  const book = utils.book_new();
  for (const name of ["One", "Two"]) utils.book_append_sheet(book, utils.aoa_to_sheet([["Title"], ...Array.from({ length: 1001 }, (_, i) => [`Case ${i}`])]), name);
  await assert.rejects(decodeImportFile(file(new Uint8Array(write(book, { type: "array", bookType: "xlsx" })), "cases.xlsx")), { code: "IMPORT_LIMIT_EXCEEDED" });
});
test("decoder failures expose stable codes for localization", async () => {
  for (const [name, value, code] of [["bad.json", "{", "IMPORT_INVALID_JSON"], ["bad.csv", "Title\n", "IMPORT_NO_RECORDS"], ["bad.pdf", "x", "IMPORT_UNSUPPORTED_FORMAT"]]) {
    await assert.rejects(decodeImportFile(file(value, name)), (error: unknown) => Boolean(error && typeof error === "object" && "code" in error && error.code === code));
  }
});
test("tabular records use source sheet names as their default folder context", async () => {
  const source = (await decodeImportFile(file('Summary,Description\nReconnect,Open Settings', 'Linear export.csv'))).source as any;
  assert.equal(source.sheets[0].name, 'Linear export');
  assert.equal(source.sheets[0].cases[0].folderPath, '/Linear export');
  assert.equal(source.sheets[0].cases[0].title, 'Reconnect');
});
test("strict JSON rejects duplicate keys including escaped spellings before last-value-wins parsing", async () => {
  for (const value of ['{"cases":[{"title":"one","title":"two"}]}', '{"title":"one","ti\\u0074le":"two"}']) {
    await assert.rejects(decodeImportFile(file(value, 'duplicates.json')), { code: 'IMPORT_DUPLICATE_JSON_KEYS' });
  }
  assert.deepEqual((await decodeImportFile(file('[{"title":"one"},{"title":"two"}]', 'distinct.json'))).source, [{ title: 'one' }, { title: 'two' }]);
});
test("strict JSON rejects comments, trailing commas, and excessive nesting", async () => {
  for (const value of ['{/*comment*/"cases":[]}', '{"title":"Case",}', '['.repeat(101) + '0' + ']'.repeat(101)]) {
    await assert.rejects(decodeImportFile(file(value, 'invalid.json')));
  }
});
test("known API envelopes reject partial pages and unresolved TestRail shared steps", async () => {
  for (const source of [
    { isLast: false, nextPageToken: 'next', issues: [{ key: 'QA-1', fields: { summary: 'Case' } }] },
    { startAt: 0, total: 2, issues: [{ key: 'QA-1', fields: { summary: 'Case' } }] },
    { data: { issues: { nodes: [{ id: 'one', title: 'Case' }], pageInfo: { hasNextPage: true } } } },
    { data: { issues: { nodes: [{ id: 'one', title: 'Case' }] } }, errors: [{ message: 'Denied' }] },
    { cases: [{ id: 42, title: 'Case', custom_steps_separated: [{ shared_step_id: 3 }] }], _links: { next: null } },
    { cases: [{ id: 42, title: 'Case', section_id: 1 }], _links: { next: '/page/2' } },
  ]) {
    await assert.rejects(decodeImportFile(file(JSON.stringify(source), 'provider.json')), { code: 'IMPORT_INCOMPLETE_PROVIDER' });
  }
});
test("JSON rejects integers that would silently round provider identities", async () => {
  await assert.rejects(decodeImportFile(file('{"cases":[{"id":9007199254740993,"title":"Exact ID"}]}', 'unsafe-id.json')), { code: 'IMPORT_UNSAFE_NUMBER' });
  const result = await decodeImportFile(file('{"cases":[{"id":"9007199254740993","title":"Exact ID"}]}', 'string-id.json'));
  assert.equal((result.source as any).cases[0].id, '9007199254740993');
});
test("JSON rejects numeric literals whose decimal value would change during decoding", async () => {
  for (const literal of ['0.10000000000000001', '1e-400', '-0']) {
    await assert.rejects(decodeImportFile(file(`{"value":${literal}}`, 'number.json')), { code: 'IMPORT_UNSAFE_NUMBER' });
  }
  assert.deepEqual((await decodeImportFile(file('{"a":0.1,"b":1e2,"c":1.00}', 'numbers.json'))).source, { a: 0.1, b: 100, c: 1 });
});
test("spreadsheet rejects numeric identities beyond its safe supported range", async () => {
  const book = utils.book_new();
  utils.book_append_sheet(book, utils.aoa_to_sheet([['Title','ID'],['Exact identity',9007199254740992]]), 'Sheet');
  await assert.rejects(decodeImportFile(file(new Uint8Array(write(book, { type: 'array', bookType: 'xlsx' })), 'unsafe.xlsx')), { code: 'IMPORT_UNSAFE_NUMBER' });
});
test("TestRail shared-step IDs with inline source content are already resolved", async () => {
  const source = { cases: [{ id: 42, title: 'Inline steps', custom_steps_separated: [{ shared_step_id: 3, content: 'Source action', expected: 'Source result' }, { shared_step_id: null, content: 'Inline action', expected: '' }] }], _links: { next: null } };
  assert.deepEqual((await decodeImportFile(file(JSON.stringify(source), 'testrail.json'))).source, source);
});
test("unsafe number failures tell both locales how to preserve source values", async () => {
  const { importFailureMessage } = await import("../../../localization/import-error");
  let failure: unknown;
  try { await decodeImportFile(file('{"id":9007199254740993}', 'numeric-id.json')); } catch (error) { failure = error; }
  assert.equal((failure as any).code, "IMPORT_UNSAFE_NUMBER");
  assert.match(importFailureMessage(failure, "en"), /precision/i);
  assert.match(importFailureMessage(failure, "en"), /text|string/i);
  assert.match(importFailureMessage(failure, "ru"), /точност/i);
  assert.match(importFailureMessage(failure, "ru"), /текст|строк/i);
});
