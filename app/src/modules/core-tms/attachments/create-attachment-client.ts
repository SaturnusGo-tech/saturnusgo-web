import { resolveTmsApiBase } from "../../../core/tms/config/api-base";
import { createPrivateAttachmentClient, type PrivateAttachmentClient } from "./application/private-attachment-client";
import { createAttachmentHttpTransport, type AccessTokenProvider } from "./data/attachment-http-transport";
import { calculateFileSha256 } from "./infrastructure/digest/file-sha256";

export interface AttachmentClientConfiguration {
  readonly apiBase: string;
  readonly accessToken: AccessTokenProvider;
  readonly fetch?: typeof fetch;
}

export function createAttachmentClient(
  configuration: AttachmentClientConfiguration,
): PrivateAttachmentClient {
  return createPrivateAttachmentClient({
    transport: createAttachmentHttpTransport({
      ...configuration,
      apiBase: resolveTmsApiBase(
        configuration.apiBase,
        process.env.NODE_ENV === "production",
      ),
    }),
    digest: calculateFileSha256,
  });
}
