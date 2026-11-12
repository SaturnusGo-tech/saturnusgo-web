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
