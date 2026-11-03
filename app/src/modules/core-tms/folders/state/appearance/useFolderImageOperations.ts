import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { useMemo } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useOptionalAttachmentClient } from "../../../attachments/presentation/context/AttachmentClientProvider";
import { uploadFolderImage } from "../../data/appearance/folder-image-upload";
import type { RepositoryFolder } from "../../model/folder";

export function useFolderImageOperations() {
  const { locale } = useTmsLocale(); const http = useTmsHttpClient(); const attachments = useOptionalAttachmentClient();
  return useMemo(() => attachments ? {
    upload: (folder: RepositoryFolder, file: File, key: string, signal: AbortSignal) =>
      uploadFolderImage(http, attachments, folder, file, key, signal, locale),
    read: (assetId: string, signal: AbortSignal) => attachments.createAccess({ attachmentId: assetId, signal }),
  } : {}, [http, attachments, locale]);
}
