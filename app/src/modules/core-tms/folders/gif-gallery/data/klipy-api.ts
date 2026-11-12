import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { components } from "../../../../../core/tms/generated/tms-api";
import { KlipyError } from "../model/klipy-types";
import { readKlipyPage } from "./klipy-response";
export { KlipyError } from "../model/klipy-types";

type Input = { http: TmsHttpClient; workspaceId: string; query: string; signal: AbortSignal };
type GifGalleryPage = components["schemas"]["GifGalleryPage"];
type GifShareRequest = components["schemas"]["GifShareRequest"];
function path(input: Input) {
  input.signal.throwIfAborted();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(input.workspaceId) || input.query.length > 200) throw new KlipyError("access");
  return `/workspaces/${encodeURIComponent(input.workspaceId)}/gifs`;
}
async function request<T>(input: Input, operation: (signal: AbortSignal) => Promise<T>) {
  const signal = AbortSignal.any([input.signal, AbortSignal.timeout(10_000)]);
  try {
    const result = await operation(signal); signal.throwIfAborted(); return result;
  } catch (error) {
    input.signal.throwIfAborted();
    if (error instanceof KlipyError) throw error;
    if (error instanceof TmsApiError && error.status === 429) throw new KlipyError("rate", error.retryAfterSeconds ?? 30);
    throw new KlipyError(error instanceof TmsApiError && [401, 403].includes(error.status) ? "access" : "network");
  }
}
export async function getKlipyPage(input: Input & { locale: "ru" | "en"; cursor?: string }) {
  const endpoint = path(input);
  if (input.cursor && input.cursor.length > 1024) throw new KlipyError("response");
  const query = new URLSearchParams({ locale: input.locale, ...(input.query.trim() ? { q: input.query } : {}),
    ...(input.cursor ? { cursor: input.cursor } : {}) });
  return request(input, async signal => readKlipyPage((await input.http.getResource<GifGalleryPage>(`${endpoint}?${query}`, signal)).data));
}
export async function registerKlipyShare(input: Input & { id: string }) {
  const endpoint = path(input);
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(input.id)) throw new KlipyError("response");
  const body: GifShareRequest = { id: input.id, ...(input.query ? { query: input.query } : {}) };
  return request(input, signal => input.http.mutate<void>(`${endpoint}/share`, "POST", body, signal));
}
