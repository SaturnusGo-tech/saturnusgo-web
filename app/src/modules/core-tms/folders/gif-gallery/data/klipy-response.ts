import { KlipyError, type KlipyItem, type KlipyPage } from "../model/klipy-types";
import { klipyMediaUrl, klipyProviderUrl } from "../model/klipy-urls";

const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new KlipyError("response");
  return value as Record<string, unknown>;
};
function item(input: unknown): KlipyItem {
  const value = object(input);
  if (typeof value.id !== "string" || !/^[A-Za-z0-9_-]{1,200}$/.test(value.id) ||
    ![value.title, value.description, value.credit].every(field => typeof field === "string")) throw new KlipyError("response");
  const url = klipyMediaUrl(value.url);
  const sourceUrl = value.sourceUrl === undefined ? undefined : klipyProviderUrl(value.sourceUrl, ["klipy.com"]);
  return { appearance: { kind: "gif", provider: "klipy", id: value.id, url, ...(sourceUrl ? { sourceUrl } : {}) },
    title: value.title as string, description: value.description as string, credit: value.credit as string };
}
export function readKlipyPage(payload: unknown): KlipyPage {
  const value = object(payload);
  if (!Array.isArray(value.items) || value.items.length > 12 || typeof value.next !== "string" || value.next.length > 1024) throw new KlipyError("response");
  return { items: value.items.map(item), next: value.next };
}
