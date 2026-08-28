import type { components } from "../../../../core/tms/generated/tms-api";
import type {
  AttachmentTransportPort,
  CreateUploadIntentInput,
  FinalizeUploadInput,
  PendingAttachmentUpload,
} from "../application/attachment-transport-port";
import type { CreateAttachmentAccessInput } from "../domain/attachment";
import {
  AttachmentClientError,
  type AttachmentClientErrorCode,
} from "../domain/attachment-client-error";
import { attachmentDtoMapper } from "./attachment-dto-mapper";

type IntentRequestDto = components["schemas"]["AttachmentUploadIntentCreateRequest"];
type FinalizeRequestDto = components["schemas"]["AttachmentUploadFinalizeRequest"];
type AccessRequestDto = components["schemas"]["AttachmentAccessCreateRequest"];
type IntentEnvelopeDto = components["schemas"]["AttachmentUploadIntentEnvelope"];
type AttachmentEnvelopeDto = components["schemas"]["AttachmentEnvelope"];
type AccessEnvelopeDto = components["schemas"]["AttachmentAccessEnvelope"];
type ErrorEnvelopeDto = components["schemas"]["ErrorEnvelope"];
type ServerErrorCode = components["schemas"]["ErrorCode"];

export type AccessTokenProvider = (signal?: AbortSignal) => Promise<string>;

export interface AttachmentHttpTransportConfiguration {
  readonly apiBase: string;
  readonly accessToken: AccessTokenProvider;
  readonly fetch?: typeof fetch;
}

const errorCodes = new Set<ServerErrorCode>([
  "AUTHENTICATION_REQUIRED", "FORBIDDEN", "VALIDATION_ERROR", "BAD_REQUEST", "NOT_FOUND",
  "CONFLICT", "INVALID_TRANSITION", "PRECONDITION_REQUIRED", "PRECONDITION_FAILED",
  "IDEMPOTENCY_KEY_REUSED", "UPLOAD_INTENT_EXPIRED", "ATTACHMENT_DIGEST_MISMATCH",
  "PAYLOAD_TOO_LARGE", "UNSUPPORTED_MEDIA_TYPE", "INTERNAL_ERROR",
]);

function normalizedApiBase(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AttachmentClientError("INVALID_CLIENT_INPUT", "TMS API base URL is invalid.");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new AttachmentClientError("INVALID_CLIENT_INPUT", "TMS API base URL is unsafe.");
  }
  return url.toString().replace(/\/$/, "");
}

async function apiError(response: Response): Promise<AttachmentClientError> {
  let payload: ErrorEnvelopeDto | null = null;
  try {
    payload = (await response.json()) as ErrorEnvelopeDto;
  } catch {
    // A non-contract body must never be shown to the user.
  }
  const candidate = payload?.error;
  const code = candidate && errorCodes.has(candidate.code)
    ? candidate.code as AttachmentClientErrorCode
    : "INTERNAL_ERROR";
  return new AttachmentClientError(
    code,
    candidate?.message || `TMS API returned ${response.status}.`,
    response.status,
    candidate?.requestId || response.headers.get("x-request-id"),
  );
}

function responseData<T>(payload: unknown): T {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    throw new AttachmentClientError("INVALID_API_RESPONSE", "TMS API response is missing data.");
  }
  return (payload as { data: T }).data;
}

export function createAttachmentHttpTransport(
  configuration: AttachmentHttpTransportConfiguration,
): AttachmentTransportPort {
  const apiBase = normalizedApiBase(configuration.apiBase);
  const fetcher = configuration.fetch ?? fetch;

  async function api<T>(
    path: string,
    body: unknown,
    context: { signal?: AbortSignal; requestId?: string; headers?: Record<string, string> },
    expectedStatus: number,
  ): Promise<{ data: T; response: Response }> {
    let token: string;
    try {
      token = await configuration.accessToken(context.signal);
    } catch (error) {
      context.signal?.throwIfAborted();
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      throw new AttachmentClientError("AUTHENTICATION_REQUIRED", "TMS access token is unavailable.");
    }
    if (!/^\S{1,8192}$/.test(token)) {
      throw new AttachmentClientError("AUTHENTICATION_REQUIRED", "TMS access token is invalid.");
    }
    const headers = new Headers(context.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    if (context.requestId) headers.set("X-Request-Id", context.requestId);
    const response = await fetcher(`${apiBase}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: context.signal,
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
    });
    if (response.status !== expectedStatus) throw await apiError(response);
    return { data: responseData<T>(await response.json()), response };
  }

  return Object.freeze({
    async createUploadIntent(input: CreateUploadIntentInput) {
      const body: IntentRequestDto = {
        projectId: input.projectId, owner: input.owner, kind: input.kind,
        originalFilename: input.originalFilename, mimeType: input.mimeType,
        byteSize: input.byteSize, sha256: input.sha256,
      };
      const result = await api<IntentEnvelopeDto["data"]>("/attachments/upload-intents", body, {
        signal: input.signal, requestId: input.requestId,
        headers: { "Idempotency-Key": input.idempotencyKey },
      }, 201);
      const etag = result.response.headers.get("etag");
      if (!etag || !/^"[^"]+"$/.test(etag)) {
        throw new AttachmentClientError("INVALID_API_RESPONSE", "Upload intent ETag is missing.");
      }
      return { intent: attachmentDtoMapper.intent(result.data), etag };
    },
    async uploadPrivateObject(intent: PendingAttachmentUpload, file: File, signal?: AbortSignal) {
      let target: URL;
      try {
        target = new URL(intent.uploadUrl);
      } catch {
        throw new AttachmentClientError("INVALID_API_RESPONSE", "Attachment upload URL is invalid.");
      }
      const expiresAt = Date.parse(intent.expiresAt);
      if (target.protocol !== "https:" || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        throw new AttachmentClientError("UPLOAD_INTENT_EXPIRED", "Attachment upload intent expired.");
      }
      const headers = new Headers(intent.headers);
      for (const name of headers.keys()) {
        if (["authorization", "cookie", "proxy-authorization"].includes(name.toLowerCase())) {
          throw new AttachmentClientError("INVALID_API_RESPONSE", "Upload intent contains unsafe headers.");
        }
      }
      const response = await fetcher(target, {
        method: "PUT", headers, body: file, signal, cache: "no-store",
        credentials: "omit", redirect: "error", referrerPolicy: "no-referrer",
      });
      if (!response.ok) {
        throw new AttachmentClientError("DIRECT_UPLOAD_FAILED", `Private upload returned ${response.status}.`, response.status);
      }
      const etag = response.headers.get("etag");
      if (!etag || etag.length > 512) {
        throw new AttachmentClientError("INVALID_API_RESPONSE", "Private upload ETag is missing.");
      }
      return etag;
    },
    async finalizeUpload(input: FinalizeUploadInput) {
      const body: FinalizeRequestDto = {
        byteSize: input.byteSize, sha256: input.sha256, storageETag: input.storageETag,
      };
      const result = await api<AttachmentEnvelopeDto["data"]>(
        `/attachments/upload-intents/${encodeURIComponent(input.intent.intentId)}/finalize`, body,
        { signal: input.signal, requestId: input.requestId, headers: {
          "Idempotency-Key": input.idempotencyKey, "If-Match": input.intentETag,
        } }, 200,
      );
      return attachmentDtoMapper.metadata(result.data);
    },
    async createAccess(input: CreateAttachmentAccessInput) {
      const body: AccessRequestDto = { disposition: input.disposition ?? "inline", fileName: input.fileName };
      const result = await api<AccessEnvelopeDto["data"]>(
        `/attachments/${encodeURIComponent(input.attachmentId)}/access`, body,
        { signal: input.signal, requestId: input.requestId }, 200,
      );
      return attachmentDtoMapper.access(result.data);
    },
  });
}
