import { KlipyError } from "../model/klipy-types";
import { readKlipyPage } from "./klipy-response";
export { KlipyError } from "../model/klipy-types";

type Input = { key: string; query: string; signal: AbortSignal };
async function request(path: string, input: Input, params: Record<string, string>, fetcher: typeof fetch) {
  if (!input.key.trim()) throw new KlipyError("missing_key");
  input.signal.throwIfAborted();
  const url = new URL(`https://api.klipy.com/v2/${path}`);
  url.search = new URLSearchParams({ key: input.key, ...params }).toString();
  let response: Response;
  try {
    response = await fetcher(url, { headers: { accept: "application/json" }, credentials: "omit", mode: "cors",
      redirect: "error", cache: "no-store", referrerPolicy: "strict-origin-when-cross-origin",
      signal: AbortSignal.any([input.signal, AbortSignal.timeout(10_000)]) });
  } catch { input.signal.throwIfAborted(); throw new KlipyError("network"); }
  input.signal.throwIfAborted();
  if (!response.ok) {
    await response.body?.cancel();
    if (response.status === 429) {
      const value = response.headers.get("retry-after") ?? "";
      const seconds = /^\d+$/.test(value) ? Number(value) : (Date.parse(value) - Date.now()) / 1000;
      throw new KlipyError("rate", Math.min(86_400, Math.max(1, Math.ceil(Number.isFinite(seconds) ? seconds : 30))));
    }
    throw new KlipyError([401, 403].includes(response.status) ? "access" : "network");
  }
  return response;
}
export async function getKlipyPage(input: Input & { locale: "ru" | "en"; cursor?: string }, fetcher: typeof fetch = fetch) {
  const searching = Boolean(input.query.trim());
  const response = await request(searching ? "search" : "featured", input, {
    locale: input.locale, limit: "12", media_filter: "tinygif,gif", ...(searching ? { q: input.query } : {}),
    ...(input.cursor ? { pos: input.cursor } : {}),
  }, fetcher);
  const page = await readKlipyPage(response); input.signal.throwIfAborted(); return page;
}
export async function registerKlipyShare(input: Input & { id: string }, fetcher: typeof fetch = fetch) {
  const response = await request("registershare", input, { id: input.id, ...(input.query ? { q: input.query } : {}) }, fetcher);
  await response.body?.cancel();
}
