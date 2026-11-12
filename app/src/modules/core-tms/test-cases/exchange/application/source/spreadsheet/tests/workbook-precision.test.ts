import test from "node:test";
import assert from "node:assert/strict";
import { utils, write } from "xlsx";
import { BlobReader, BlobWriter, TextReader, TextWriter, Uint8ArrayWriter, Uint8ArrayReader, ZipReader, ZipWriter } from "@zip.js/zip.js";
import { decodeImportFile } from "../../decode-import-file";

async function workbookNumber(value: string, type = ""): Promise<File> {
  const book = utils.book_new(); utils.book_append_sheet(book, utils.aoa_to_sheet([["ID", "Title"], [1, "Precision"]]), "Cases");
  const reader = new ZipReader(new BlobReader(new Blob([write(book, { type: "array", bookType: "xlsx" })])));
  const writer = new ZipWriter(new BlobWriter());
  try {
    for (const entry of await reader.getEntries()) {
      if (entry.directory) continue;
      if (entry.filename === "xl/worksheets/sheet1.xml") {
        const xml = (await entry.getData(new TextWriter(), { useWebWorkers: false }))
          .replace('<c r="A2"><v>1</v>', `<c r="A2"${type ? ` t="${type}"` : ""}><v>${value}</v>`);
        await writer.add(entry.filename, new TextReader(xml), { useWebWorkers: false });
      } else {
        const bytes = await entry.getData(new Uint8ArrayWriter(), { useWebWorkers: false });
        await writer.add(entry.filename, new Uint8ArrayReader(bytes), { useWebWorkers: false });
      }
    }
    return new File([await writer.close()], "precision.xlsx");
  } finally { await reader.close(); }
}

test("XLSX rejects numeric cell lexemes rounded by the workbook parser", async () => {
  for (const value of ["9007199254740990.5", "0.10000000000000001", "1.0000000000000001", "1e-324"]) {
    await assert.rejects(decodeImportFile(await workbookNumber(value)), { code: "IMPORT_UNSAFE_NUMBER" });
  }
});

test("XLSX preserves precise text IDs and accepts equivalent numeric notation", async () => {
  const source = (await decodeImportFile(await workbookNumber("9007199254740990.5", "str"))).source as any;
  assert.equal(source.sheets[0].cases[0].sourceKey, "9007199254740990.5");
  for (const value of ["1.000", "1e1", "+.5", "0001.0"]) {
    const numeric = (await decodeImportFile(await workbookNumber(value, "n"))).source as any;
    assert.equal(numeric.sheets[0].cases[0].sourceKey, Number(value));
  }
});
