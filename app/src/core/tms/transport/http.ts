import type { Bootstrap } from "../contracts/legacy-contract";
import { resolveTmsApiBase } from "../config/api-base";

export type MutationMethod = "POST" | "PATCH" | "DELETE";
export type TmsAccessTokenProvider = (signal?: AbortSignal) => Promise<string>;

export interface TmsHttpClient {
  fetchBootstrap(signal?: AbortSignal): Promise<Bootstrap>;
  mutate<T>(path: string, method: MutationMethod, body?: unknown, signal?: AbortSignal): Promise<T>;
}

export interface TmsHttpClientConfiguration {
  readonly apiBase: string;
  readonly accessToken: TmsAccessTokenProvider;
  readonly fetch?: typeof fetch;
  readonly production?: boolean;
}

export class TmsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string | null,
  ) {
    super(message);
    this.name = "TmsApiError";
  }
}

async function bearer(provider: TmsAccessTokenProvider, signal?: AbortSignal): Promise<string> {
  try {
    const token = await provider(signal);
    if (!/^\S{1,8192}$/.test(token)) throw new Error("invalid bearer token");
    return token;
  } catch (error) {
    signal?.throwIfAborted();
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new TmsApiError("TMS authentication is required.", 401, null);
  }
}

export function createTmsHttpClient(
  configuration: TmsHttpClientConfiguration,
): TmsHttpClient {
  const apiBase = resolveTmsApiBase(
    configuration.apiBase,
    configuration.production ?? process.env.NODE_ENV === "production",
  );
  const fetcher = configuration.fetch ?? fetch;

  async function request(path: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
    const token = await bearer(configuration.accessToken, signal);
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    const response = await fetcher(`${apiBase}${path}`, {
      ...init,
      headers,
      signal,
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
    });
    if (!response.ok) {
      throw new TmsApiError(
        `TMS API returned ${response.status}`,
        response.status,
        response.headers.get("x-request-id"),
      );
    }
    return response;
  }

  return Object.freeze({
    async fetchBootstrap(signal?: AbortSignal): Promise<Bootstrap> {
      return await (await request("/bootstrap", { method: "GET" }, signal)).json() as Bootstrap;
    },
    async mutate<T>(
      path: string,
      method: MutationMethod,
      body?: unknown,
      signal?: AbortSignal,
    ): Promise<T> {
      const response = await request(path, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }, signal);
      if (response.status === 204) return undefined as T;
      const payload = await response.json() as { data?: T } | T;
      return typeof payload === "object" && payload !== null && "data" in payload
        ? (payload as { data: T }).data
        : payload as T;
    },
  });
}
