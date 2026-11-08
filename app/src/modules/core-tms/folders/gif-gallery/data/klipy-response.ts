import { KlipyError, type KlipyItem, type KlipyPage } from "../model/klipy-types";
import { klipyMediaUrl, klipyProviderUrl } from "../model/klipy-urls";

const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new KlipyError("response");
  return value as Record<string, unknown>;
};
function item(input: unknown): KlipyItem {
  const value = object(input);
  if (typeof value.id !== "string" || !/^[A-Za-z0-9_-]{1,200}$/.test(value.id) || value.type === "ad") throw new KlipyError("response");
  const formats = object(value.media_formats), media = object(formats.tinygif ?? formats.gif);
  const url = klipyMediaUrl(media.url);
  const sourceUrl = value.itemurl ? klipyProviderUrl(value.itemurl, ["klipy.com"]) : undefined;
  return { appearance: { kind: "gif", provider: "klipy", id: value.id, url, ...(sourceUrl ? { sourceUrl } : {}) },
    title: typeof value.title === "string" ? value.title : "GIF",
    description: typeof value.content_description === "string" ? value.content_description : "",
    credit: typeof value.content_description_source === "string" ? value.content_description_source : "" };
}
export async function readKlipyPage(response: Response): Promise<KlipyPage> {
  const reader = response.body?.getReader(); if (!reader) throw new KlipyError("response");
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    for (;;) {
      const part = await reader.read(); if (part.done) break;
      size += part.value.byteLength;
      if (size > 2_097_152) { await reader.cancel(); throw new KlipyError("response"); }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const value = object(JSON.parse(new TextDecoder().decode(bytes)));
    if (!Array.isArray(value.results) || value.results.length > 50 || value.next !== undefined &&
      (typeof value.next !== "string" || value.next.length > 1024)) throw new KlipyError("response");
    return { items: value.results.map(item), next: typeof value.next === "string" ? value.next : "" };
  } catch { throw new KlipyError("response"); } finally { reader.releaseLock(); }
}
