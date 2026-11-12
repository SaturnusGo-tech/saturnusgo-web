import test from "node:test";
import assert from "node:assert/strict";
import { utils, write } from "xlsx";
import { BlobReader, BlobWriter, TextReader, TextWriter, Uint8ArrayWriter, Uint8ArrayReader, ZipReader, ZipWriter } from "@zip.js/zip.js";
import { decodeImportFile } from "../../decode-import-file";
async function workbookWithAlteredDimension(farRow = false): Promise<File> {
  const book = utils.book_new(); utils.book_append_sheet(book, utils.aoa_to_sheet([["Title"], ["First"], ["Second"]]), "Cases");
  const source = new Blob([write(book, { type: "array", bookType: "xlsx" })]);
  const reader = new ZipReader(new BlobReader(source)); const writer = new ZipWriter(new BlobWriter());
  try {
    for (const entry of await reader.getEntries()) {
      if (entry.directory) continue;
      if (entry.filename === "xl/worksheets/sheet1.xml") {
        let xml = await entry.getData(new TextWriter(), { useWebWorkers: false });
        xml = xml.replace('ref="A1:A3"', 'ref="A1:A2"');
        if (farRow) xml = xml.replace('<row r="3">', '<row r="3000">').replace('r="A3"', 'r="A3000"');
        await writer.add(entry.filename, new TextReader(xml), { useWebWorkers: false });
      } else {
        const bytes = await entry.getData(new Uint8ArrayWriter(), { useWebWorkers: false });
        await writer.add(entry.filename, new Uint8ArrayReader(bytes), { useWebWorkers: false });
      }
    }
    return new File([await writer.close()], "understated.xlsx");
  } finally { await reader.close(); }
}
test("XLSX imports every actual cell when the declared dimension omits a source row", async () => {
  const source = (await decodeImportFile(await workbookWithAlteredDimension())).source as any;
  assert.deepEqual(source.sheets[0].cases.map((row: any) => row.title), ["First", "Second"]);
});
test("XLSX rejects far-out actual rows hidden behind an understated dimension", async () => {
  await assert.rejects(decodeImportFile(await workbookWithAlteredDimension(true)), { code: "IMPORT_LIMIT_EXCEEDED" });
});

async function workbookWithSheetIdentity(edit: (xml: string) => string, fileName = "xl/workbook.xml"): Promise<File> {
  const book = utils.book_new();
  for (const name of ["First", "Second"]) utils.book_append_sheet(book, utils.aoa_to_sheet([["Title"], [name]]), name);
  const reader = new ZipReader(new BlobReader(new Blob([write(book, { type: "array", bookType: "xlsx" })])));
  const writer = new ZipWriter(new BlobWriter());
  try {
    for (const entry of await reader.getEntries()) {
      if (entry.directory) continue;
      if (entry.filename === fileName) {
        const xml = await entry.getData(new TextWriter(), { useWebWorkers: false });
        await writer.add(entry.filename, new TextReader(edit(xml)), { useWebWorkers: false });
      } else {
        const bytes = await entry.getData(new Uint8ArrayWriter(), { useWebWorkers: false });
        await writer.add(entry.filename, new Uint8ArrayReader(bytes), { useWebWorkers: false });
      }
    }
    return new File([await writer.close()], "sheet-identities.xlsx");
  } finally { await reader.close(); }
}

test("XLSX rejects sheet aliases that would overwrite or repeat another source sheet", async () => {
  for (const [from, to] of [['name="Second"', 'name="First"'], ['name="Second"', 'name="first"'],
    ['sheetId="2"', 'sheetId="1"'], ['r:id="rId2"', 'r:id="rId1"']]) {
    await assert.rejects(decodeImportFile(await workbookWithSheetIdentity(xml => xml.replace(from, to))), { code: "IMPORT_INVALID_WORKBOOK" });
  }
});

test("XLSX keeps separate valid sheets even when they have no source ID column", async () => {
  const source = (await decodeImportFile(await workbookWithSheetIdentity(xml => xml))).source as any;
  assert.deepEqual(source.sheets.map((sheet: any) => [sheet.name, sheet.cases[0].title]), [["First", "First"], ["Second", "Second"]]);
});

test("XLSX rejects duplicate relationship definitions before a sheet target is overwritten", async () => {
  const file = await workbookWithSheetIdentity(xml => xml.replace('Id="rId2"', 'Id="rId1"'), "xl/_rels/workbook.xml.rels");
  await assert.rejects(decodeImportFile(file), { code: "IMPORT_INVALID_WORKBOOK" });
});

test("XLSX compares decoded XML identities so entity spelling cannot hide duplicate sheets", async () => {
  for (const name of ["A&#38;B", "A_x0026_B"]) {
    const names = await workbookWithSheetIdentity(xml => xml.replace('name="First"', 'name="A&amp;B"').replace('name="Second"', `name="${name}"`));
    await assert.rejects(decodeImportFile(names), { code: "IMPORT_INVALID_WORKBOOK" });
  }
  const relationships = await workbookWithSheetIdentity(xml => xml.replace('Id="rId2"', 'Id="rI&#100;1"'), "xl/_rels/workbook.xml.rels");
  await assert.rejects(decodeImportFile(relationships), { code: "IMPORT_INVALID_WORKBOOK" });
});
