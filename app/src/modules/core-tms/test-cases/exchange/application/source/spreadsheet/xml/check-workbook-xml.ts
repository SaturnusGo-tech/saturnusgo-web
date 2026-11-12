import { XMLParser, XMLValidator } from "fast-xml-parser";
import { ImportSourceError } from "../../import-source-error";
import { assertImportNumber } from "../../json/assert-import-number";
export type WorkbookBudget = { cells: number; nodes: number };

export async function checkWorkbookXml(bytes: Uint8Array, budget: WorkbookBudget): Promise<void> {
  const { utils } = await import("xlsx");
  const xml = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)) throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
  const entityText = xml.replace(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->/g, "");
  if (/&(?!(?:amp|lt|gt|apos|quot|#\d+|#x[0-9a-fA-F]+);)[^;\s<&]*;/.test(entityText)) throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
  let worksheet = false; let row = 0; let column = -1; let numericCell = false;
  const addresses = new Set<string>();
  const sheetNames = new Set<string>(), sheetIds = new Set<string>(), sheetRelationships = new Set<string>();
  const relationshipIds = new Set<string>();
  // Numeric XML references share FXP's htmlEntities option; the guard above keeps named entities XML-only.
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "", removeNSPrefix: true,
    parseTagValue: false, parseAttributeValue: false, processEntities: true, htmlEntities: true, maxNestedTags: 100,
    tagValueProcessor(tag, value, path) {
      if (numericCell && path === "worksheet.sheetData.row.c.v") assertImportNumber(value, Number(value));
      return value;
    },
    updateTag(tag, path, attributes) {
      if (++budget.nodes > 500_000) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
      if (path === "Relationships.Relationship") {
        const id = attributes.Id;
        if (!id?.trim() || relationshipIds.has(id)) throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
        relationshipIds.add(id);
      }
      if (path === "workbook.sheets.sheet") {
        const { name, sheetId, id } = attributes;
        if (!name?.trim() || !sheetId?.trim() || !id?.trim() || sheetNames.has(name.toLowerCase())
          || sheetIds.has(sheetId) || sheetRelationships.has(id)) throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
        sheetNames.add(name.toLowerCase()); sheetIds.add(sheetId); sheetRelationships.add(id);
      }
      if (path === "worksheet") worksheet = true;
      if (!worksheet) return tag;
      if (path === "worksheet.sheetData.row") {
        row = attributes.r === undefined ? row + 1 : Number(attributes.r); column = -1;
        if (!Number.isSafeInteger(row) || row < 1 || row > 2001) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
      }
      if (path === "worksheet.sheetData.row.c") {
        numericCell = attributes.t === undefined || attributes.t === "n";
        if (++budget.cells > 100_000) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
        let location = { r: row - 1, c: column + 1 };
        if (attributes.r !== undefined) {
          if (typeof attributes.r !== "string" || !/^[A-Z]+[1-9][0-9]*$/.test(attributes.r)) throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
          location = utils.decode_cell(attributes.r);
        }
        if (location.r < 0 || location.r > 2000 || location.c < 0 || location.c >= 256) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
        column = location.c;
        const address = utils.encode_cell(location);
        if (addresses.has(address)) throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
        addresses.add(address);
      }
      return tag;
    },
  });
  parser.parse(xml);
  if (XMLValidator.validate(xml) !== true) throw new ImportSourceError("IMPORT_INVALID_WORKBOOK");
}
