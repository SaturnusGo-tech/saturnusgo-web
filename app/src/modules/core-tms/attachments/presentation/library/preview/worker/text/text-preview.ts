import { isJsonFile, type ParsedFilePreview } from "../../model/file-preview-format";

export const textByteLimit = 512 * 1024;
type TextPreview = Extract<ParsedFilePreview, { kind: "text" }>;

function prettyJson(text: string) {
  try { JSON.parse(text); }
  catch { return text; }

  // Keep the original tokens so large IDs, duplicate keys and escapes survive formatting.
  const tokens = text.match(/"(?:[^"\\]|\\[\s\S])*"|[{}\[\],:]|[^\s{}\[\],:]+/g) ?? [];
  let formatted = "";
  let depth = 0;
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    const previous = tokens[index - 1];
    const closes = token === "}" || token === "]";
    const next = tokens[index + 1];

    if (closes) {
      depth--;
      if (previous !== "{" && previous !== "[") formatted += "\n" + "  ".repeat(depth);
    }
    formatted += token;
    if (token === "{" || token === "[") {
      if (++depth > 100) return text;
      if (next !== "}" && next !== "]") formatted += "\n" + "  ".repeat(depth);
    } else if (token === ",") {
      formatted += "\n" + "  ".repeat(depth);
    } else if (token === ":") {
      formatted += " ";
    }
    if (formatted.length > textByteLimit * 2) return text;
  }
  return formatted;
}

export function decodeTextPreview(bytes: Uint8Array, limited: boolean, filename: string, mimeType?: string): TextPreview {
  let encoding = "utf-8";
  if (bytes[0] === 0xff && bytes[1] === 0xfe) encoding = "utf-16le";
  if (bytes[0] === 0xfe && bytes[1] === 0xff) encoding = "utf-16be";
  const text = new TextDecoder(encoding).decode(bytes, { stream: limited });
  if (text.includes("\0")) throw new Error("Binary file cannot be shown as source");
  return {
    kind: "text",
    text: !limited && isJsonFile(filename, mimeType) ? prettyJson(text) : text,
    limited,
  };
}
