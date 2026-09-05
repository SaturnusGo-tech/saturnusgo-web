import type { components } from "../../../../../core/tms/generated/tms-api";
import { AttachmentClientError, type AttachmentClientErrorCode } from "../../domain/attachment-client-error";

type ErrorEnvelopeDto = components["schemas"]["ErrorEnvelope"];
type ServerErrorCode = components["schemas"]["ErrorCode"];
export type AccessTokenProvider = (signal?: AbortSignal) => Promise<string>;

export interface AttachmentApiConfiguration {
  readonly apiBase: string;
  readonly accessToken?: AccessTokenProvider;
  readonly credentials?: RequestCredentials;
  readonly fetch?: typeof fetch;
}

const errorCodes = new Set<ServerErrorCode>([
  "AUTHENTICATION_REQUIRED", "FORBIDDEN", "VALIDATION_ERROR", "BAD_REQUEST", "NOT_FOUND",
  "CONFLICT", "INVALID_TRANSITION", "PRECONDITION_REQUIRED", "PRECONDITION_FAILED",
  "IDEMPOTENCY_KEY_REUSED", "UPLOAD_INTENT_EXPIRED", "ATTACHMENT_DIGEST_MISMATCH",
  "PAYLOAD_TOO_LARGE", "UNSUPPORTED_MEDIA_TYPE", "INTERNAL_ERROR",
]);

function apiBase(value: string): string {
  let url: URL;
  try { url = new URL(value); } catch {
    throw new AttachmentClientError("INVALID_CLIENT_INPUT", "TMS API base URL is invalid.");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      url.search || url.hash) {
    throw new AttachmentClientError("INVALID_CLIENT_INPUT", "TMS API base URL is unsafe.");
  }
  return url.toString().replace(/\/$/, "");
}

async function apiError(response: Response): Promise<AttachmentClientError> {
  let payload: ErrorEnvelopeDto | null = null;
  try { payload = await response.json() as ErrorEnvelopeDto; } catch {
    // A non-contract body must never be shown to the user.
  }
  const candidate = payload?.error;
  const code = candidate && errorCodes.has(candidate.code)
    ? candidate.code as AttachmentClientErrorCode : "INTERNAL_ERROR";
  return new AttachmentClientError(code, candidate?.message || `TMS API returned ${response.status}.`,
    response.status, candidate?.requestId || response.headers.get("x-request-id"));
}

function responseData<T>(payload: unknown): T {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new AttachmentClientError("INVALID_API_RESPONSE", "TMS API response is missing data.");
  }
  return (payload as { data: T }).data;
}

export function createAttachmentApi(configuration: AttachmentApiConfiguration) {
  const base = apiBase(configuration.apiBase);
  const fetcher = configuration.fetch ?? fetch;
  async function token(signal?: AbortSignal): Promise<string> {
    try {
      const value = await configuration.accessToken!(signal);
      if (!/^\S{1,8192}$/.test(value)) throw new Error("invalid bearer token");
      return value;
    } catch (error) {
      signal?.throwIfAborted();
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new AttachmentClientError("AUTHENTICATION_REQUIRED", "TMS access token is unavailable.");
    }
  }
  return async function request<T>(path: string, init: RequestInit): Promise<{ data: T; response: Response }> {
    const signal = init.signal ?? undefined;
    const headers = new Headers(init.headers);
    const credentials = configuration.credentials ?? "omit";
    if (configuration.accessToken) headers.set("Authorization", `Bearer ${await token(signal)}`);
    else if (credentials !== "include") {
      throw new AttachmentClientError("AUTHENTICATION_REQUIRED", "TMS session is unavailable.");
    }
    const response = await fetcher(`${base}${path}`, {
      ...init, headers, cache: "no-store", credentials, redirect: "error",
    });
    if (!response.ok) throw await apiError(response);
    return { data: responseData<T>(await response.json()), response };
  };
}
