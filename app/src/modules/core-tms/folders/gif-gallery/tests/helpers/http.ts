import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
export type GalleryCall = { path: string; method: string; body?: unknown; signal: AbortSignal };
export function galleryHttp(send: (call: GalleryCall) => Promise<unknown>): TmsHttpClient {
  return {
    getResource: async <T,>(path: string, signal?: AbortSignal) => ({ data: await send({ path, method: "GET", signal: signal! }) as T, etag: null }),
    mutate: async <T,>(path: string, method: string, body?: unknown, signal?: AbortSignal) => await send({ path, method, body, signal: signal! }) as T,
  } as TmsHttpClient;
}
export const gifPage = (id: string, next = "") => ({ items: [{ id, title: id, description: id, credit: "Artist",
  sourceUrl: `https://klipy.com/gifs/${id}`, url: `https://static.klipy.com/${id}.gif` }], next });
export const frame = () => new Promise(resolve => setTimeout(resolve, 0));
