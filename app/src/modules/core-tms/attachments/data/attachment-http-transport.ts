import type { components } from "../../../../core/tms/generated/tms-api";
import type {
  AttachmentTransportPort,
  CreateUploadIntentInput,
  FinalizeUploadInput,
  PendingAttachmentUpload,
} from "../application/attachment-transport-port";
import type { CreateAttachmentAccessInput, RemovePrivateAttachmentInput } from "../domain/attachment";
import { AttachmentClientError } from "../domain/attachment-client-error";
import { attachmentDtoMapper } from "./attachment-dto-mapper";
import { createAttachmentApi, type AccessTokenProvider } from "./http/attachment-api";

type IntentRequestDto = components["schemas"]["AttachmentUploadIntentCreateRequest"];
type FinalizeRequestDto = components["schemas"]["AttachmentUploadFinalizeRequest"];
type AccessRequestDto = components["schemas"]["AttachmentAccessCreateRequest"];
type IntentEnvelopeDto = components["schemas"]["AttachmentUploadIntentEnvelope"];
type AttachmentEnvelopeDto = components["schemas"]["AttachmentEnvelope"];
type AccessEnvelopeDto = components["schemas"]["AttachmentAccessEnvelope"];
export type { AccessTokenProvider } from "./http/attachment-api";
export interface AttachmentHttpTransportConfiguration {
  readonly apiBase: string;
  readonly accessToken: AccessTokenProvider;
  readonly fetch?: typeof fetch;
}

export function createAttachmentHttpTransport(
  configuration: AttachmentHttpTransportConfiguration,
): AttachmentTransportPort {
  const api = createAttachmentApi(configuration);
  const fetcher = configuration.fetch ?? fetch;

  return Object.freeze({
    async getMetadata(attachmentId: string, signal?: AbortSignal) {
      const result = await api<AttachmentEnvelopeDto["data"]>(
        `/attachments/${encodeURIComponent(attachmentId)}`, { method: "GET", signal },
      );
      return { metadata: attachmentDtoMapper.metadata(result.data), etag: requiredEtag(result.response) };
    },
    async createUploadIntent(input: CreateUploadIntentInput) {
      const body: IntentRequestDto = {
        projectId: input.projectId, owner: input.owner, kind: input.kind,
        originalFilename: input.originalFilename, mimeType: input.mimeType,
        byteSize: input.byteSize, sha256: input.sha256,
      };
      const result = await api<IntentEnvelopeDto["data"]>("/attachments/upload-intents", {
        method: "POST", signal: input.signal, body: JSON.stringify(body), headers: {
          "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey,
          ...(input.requestId ? { "X-Request-Id": input.requestId } : {}),
        },
      });
      const etag = requiredEtag(result.response);
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
        `/attachments/upload-intents/${encodeURIComponent(input.intent.intentId)}/finalize`, {
          method: "POST", signal: input.signal, body: JSON.stringify(body), headers: {
            "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey,
            "If-Match": input.intentETag,
            ...(input.requestId ? { "X-Request-Id": input.requestId } : {}),
          },
        });
      return attachmentDtoMapper.metadata(result.data);
    },
    async createAccess(input: CreateAttachmentAccessInput) {
      const body: AccessRequestDto = { disposition: input.disposition ?? "inline", fileName: input.fileName };
      const result = await api<AccessEnvelopeDto["data"]>(
        `/attachments/${encodeURIComponent(input.attachmentId)}/access`, {
          method: "POST", signal: input.signal, body: JSON.stringify(body), headers: {
            "Content-Type": "application/json",
            ...(input.requestId ? { "X-Request-Id": input.requestId } : {}),
          },
        });
      return attachmentDtoMapper.access(result.data);
    },
    async remove(input: RemovePrivateAttachmentInput) {
      const result = await api<AttachmentEnvelopeDto["data"]>(
        `/attachments/${encodeURIComponent(input.attachmentId)}`, {
          method: "DELETE", signal: input.signal, headers: {
            "Idempotency-Key": input.operationKey, "If-Match": input.etag,
            ...(input.requestId ? { "X-Request-Id": input.requestId } : {}),
          },
        });
      return { metadata: attachmentDtoMapper.metadata(result.data), etag: requiredEtag(result.response) };
    },
  });
}

function requiredEtag(response: Response): string {
  const etag = response.headers.get("etag");
  if (!etag || !/^"[^"]+"$/.test(etag)) {
    throw new AttachmentClientError("INVALID_API_RESPONSE", "Attachment ETag is missing.");
  }
  return etag;
}
