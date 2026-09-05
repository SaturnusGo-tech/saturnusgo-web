import { resolveTmsApiBase } from "../config/api-base";
import type { components } from "../generated/tms-api";

type ApiError = components["schemas"]["Error"];
export type TmsApiErrorCode = ApiError["code"] | "HTTP_ERROR";

export type MutationMethod = "POST" | "PATCH" | "DELETE";
export type TmsAccessTokenProvider = (signal?: AbortSignal) => Promise<string>;

export type TmsResource<T> = {
  readonly data: T;
  readonly etag: string | null;
};

export type TmsMutationOptions = {
  readonly signal?: AbortSignal;
  readonly ifMatch?: string;
  readonly idempotencyKey?: string;
};

export interface TmsHttpClient {
  get<T>(path: string, signal?: AbortSignal): Promise<T>;
  getResource<T>(path: string, signal?: AbortSignal): Promise<TmsResource<T>>;
  mutate<T>(path: string, method: MutationMethod, body?: unknown, signal?: AbortSignal): Promise<T>;
  mutateResource<T>(
    path: string,
    method: MutationMethod,
    body?: unknown,
    options?: TmsMutationOptions,
  ): Promise<TmsResource<T>>;
}

export interface TmsHttpClientConfiguration {
  readonly apiBase: string;
  readonly accessToken?: TmsAccessTokenProvider;
  readonly credentials?: RequestCredentials;
  readonly fetch?: typeof fetch;
  readonly production?: boolean;
}

export class TmsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string | null,
    readonly code: TmsApiErrorCode = "HTTP_ERROR",
  ) {
    super(message);
    this.name = "TmsApiError";
  }
}

function boundedString(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 && normalized.length <= maximum ? normalized : null;
}

async function responseError(response: Response): Promise<TmsApiError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const envelope = typeof body === "object" && body !== null
    ? (body as { error?: unknown }).error
    : null;
  const error = typeof envelope === "object" && envelope !== null
    ? envelope as Partial<ApiError>
    : null;
  const message = boundedString(error?.message, 1000) ?? `TMS API returned ${response.status}`;
  const requestId = boundedString(error?.requestId, 128)
    ?? boundedString(response.headers.get("x-request-id"), 128);
  const code = boundedString(error?.code, 128) as ApiError["code"] | null;
  return new TmsApiError(message, response.status, requestId, code ?? "HTTP_ERROR");
}

function concurrencyEtag(response: Response): string | null {
  const value = response.headers.get("etag");
  if (!value || value.length > 512) return null;
  return value.startsWith('W/"') && value.endsWith('"') ? value.slice(2) : value;
}

async function bearer(provider: TmsAccessTokenProvider, signal?: AbortSignal): Promise<string> {
  try {
    const token = await provider(signal);
    if (!/^\S{1,8192}$/.test(token)) throw new Error("invalid bearer token");
    return token;
  } catch (error) {
    signal?.throwIfAborted();
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new TmsApiError(
      "TMS authentication is required.", 401, null, "AUTHENTICATION_REQUIRED",
    );
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
  const credentials = configuration.credentials ?? "omit";

  async function payload<T>(response: Response): Promise<T> {
    if (response.status === 204) return undefined as T;
    return await response.json() as T;
  }

  async function request(path: string, init: RequestInit, signal?: AbortSignal): Promise<Response> {
    const headers = new Headers(init.headers);
    if (configuration.accessToken) {
      headers.set("Authorization", `Bearer ${await bearer(configuration.accessToken, signal)}`);
    } else if (credentials !== "include") {
      throw new TmsApiError(
        "TMS authentication is required.", 401, null, "AUTHENTICATION_REQUIRED",
      );
    }
    const response = await fetcher(`${apiBase}${path}`, {
      ...init,
      headers,
      signal,
      cache: "no-store",
      credentials,
      redirect: "error",
    });
    if (!response.ok) {
      throw await responseError(response);
    }
    return response;
  }

  return Object.freeze({
    async get<T>(path: string, signal?: AbortSignal): Promise<T> {
      return await payload<T>(await request(path, { method: "GET" }, signal));
    },
    async getResource<T>(path: string, signal?: AbortSignal): Promise<TmsResource<T>> {
      const response = await request(path, { method: "GET" }, signal);
      const body = await payload<{ data: T }>(response);
      return { data: body.data, etag: concurrencyEtag(response) };
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
    async mutateResource<T>(
      path: string,
      method: MutationMethod,
      body?: unknown,
      options: TmsMutationOptions = {},
    ): Promise<TmsResource<T>> {
      const headers = new Headers(body === undefined
        ? undefined
        : { "Content-Type": "application/json" });
      if (options.ifMatch) headers.set("If-Match", options.ifMatch);
      if (options.idempotencyKey) {
        headers.set("Idempotency-Key", options.idempotencyKey);
      }
      const response = await request(path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      }, options.signal);
      const envelope = await payload<{ data: T }>(response);
      return { data: envelope?.data, etag: concurrencyEtag(response) };
    },
  });
}
