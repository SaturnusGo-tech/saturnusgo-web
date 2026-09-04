import type { PrivateAttachmentClient } from "../private-attachment-client";
import type {
  AttachmentMetadataResource,
  AttachmentReadAccess,
  CreateAttachmentAccessInput,
} from "../../domain/attachment";

const ACCESS_EXPIRY_GUARD_MS = 30_000;

export type AttachmentReadCache = {
  getMetadata(attachmentId: string): Promise<AttachmentMetadataResource>;
  createAccess(input: CreateAttachmentAccessInput): Promise<AttachmentReadAccess>;
  invalidate(attachmentId: string): void;
};

export function createAttachmentReadCache(
  client: PrivateAttachmentClient,
  now: () => number = Date.now,
): AttachmentReadCache {
  const metadata = new Map<string, AttachmentMetadataResource>();
  const metadataRequests = new Map<string, Promise<AttachmentMetadataResource>>();
  const access = new Map<string, AttachmentReadAccess>();
  const accessRequests = new Map<string, Promise<AttachmentReadAccess>>();

  function accessKey(input: CreateAttachmentAccessInput) {
    return [input.attachmentId, input.disposition ?? "inline", input.fileName ?? ""].join(":");
  }

  return {
    getMetadata(attachmentId) {
      const cached = metadata.get(attachmentId);
      if (cached) return Promise.resolve(cached);
      const running = metadataRequests.get(attachmentId);
      if (running) return running;
      const request = client.getMetadata(attachmentId).then((resource) => {
        metadataRequests.delete(attachmentId);
        if (resource.metadata.status === "ready") metadata.set(attachmentId, resource);
        return resource;
      }, (error) => {
        metadataRequests.delete(attachmentId);
        throw error;
      });
      metadataRequests.set(attachmentId, request);
      return request;
    },
    createAccess(input) {
      const key = accessKey(input);
      const cached = access.get(key);
      if (cached && Date.parse(cached.expiresAt) > now() + ACCESS_EXPIRY_GUARD_MS) {
        return Promise.resolve(cached);
      }
      access.delete(key);
      const running = accessRequests.get(key);
      if (running) return running;
      const { signal: _signal, ...stableInput } = input;
      const request = client.createAccess(stableInput).then((value) => {
        accessRequests.delete(key);
        access.set(key, value);
        return value;
      }, (error) => {
        accessRequests.delete(key);
        throw error;
      });
      accessRequests.set(key, request);
      return request;
    },
    invalidate(attachmentId) {
      metadata.delete(attachmentId);
      metadataRequests.delete(attachmentId);
      for (const key of access.keys()) {
        if (key.startsWith(`${attachmentId}:`)) access.delete(key);
      }
      for (const key of accessRequests.keys()) {
        if (key.startsWith(`${attachmentId}:`)) accessRequests.delete(key);
      }
    },
  };
}
