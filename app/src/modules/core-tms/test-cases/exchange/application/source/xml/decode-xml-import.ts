import { ImportSourceError } from "../import-source-error";
import { XMLParser, XMLValidator } from "fast-xml-parser";

export function decodeXmlImport(text: string): unknown {
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(text)) throw new ImportSourceError("IMPORT_UNSAFE_XML");
  const entityText = text.replace(/<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->/g, "");
  if (/&(?!(?:amp|lt|gt|apos|quot|#\d+|#x[0-9a-fA-F]+);)[^;\s<&]*;/.test(entityText)) throw new ImportSourceError("IMPORT_INVALID_XML");
  const encoding = text.match(/^\s*<\?xml\s[^?]*encoding\s*=\s*["']([^"']+)["']/i)?.[1];
  if (encoding && !/^utf-?8$/i.test(encoding)) throw new Error("IMPORT_INVALID_UTF8: UTF-8 XML is required");
  if ((text.match(/</g)?.length ?? 0) > 100_000) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
  if (XMLValidator.validate(text) !== true) throw new ImportSourceError("IMPORT_INVALID_XML");
  const parser = new XMLParser({
    ignoreAttributes: false, attributeNamePrefix: "@_", parseTagValue: false, parseAttributeValue: false,
    trimValues: false, ignoreDeclaration: true, maxNestedTags: 100,
    processEntities: { maxEntitySize: 1000, maxExpansionDepth: 1, maxTotalExpansions: 100_000, maxExpandedLength: 5_000_000, maxEntityCount: 5 },
  });
  const source: unknown = parser.parse(text);
  if (!source || typeof source !== "object" || !Object.keys(source).length) throw new ImportSourceError("IMPORT_NO_RECORDS");
  checkTextOrder(source);
  return source;
}

function checkTextOrder(value: unknown): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) { value.forEach(checkTextOrder); return; }
  const object = value as Record<string, unknown>;
  const children = Object.keys(object).filter(key => key !== "#text" && !key.startsWith("@_"));
  if (typeof object["#text"] === "string" && object["#text"].trim() && children.length) throw new ImportSourceError("IMPORT_XML_MIXED_CONTENT");
  Object.values(object).forEach(checkTextOrder);
}
