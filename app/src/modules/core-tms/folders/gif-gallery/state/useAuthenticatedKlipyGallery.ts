import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../../auth/presentation/session/TmsSessionContext";
import { useFolderAppearanceContext } from "../../state/appearance/folder-appearance-context";
import { useKlipyGallery } from "./useKlipyGallery";

export function useAuthenticatedKlipyGallery(query: string, locale: "ru" | "en") {
  const http = useOptionalTmsHttpClient(), session = useOptionalTmsSession(), folders = useFolderAppearanceContext();
  return useKlipyGallery(http, session?.workspaceId ?? folders.workspaceId ?? "", query, locale);
}
