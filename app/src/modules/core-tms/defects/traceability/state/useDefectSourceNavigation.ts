import { useEffect, useRef, useState } from "react";
import type { Defect } from "../../../../../core/tms/contracts/legacy-contract";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import type { RepositoryFolder } from "../../../folders/model/folder";
import { getFolder } from "../../../folders/data/folder-api";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { getTestCase } from "../../../test-cases/data/test-case-api";
import { resolveDefectSource } from "../model/resolveDefectSource";

type Input = {
  workspaceId: string;
  defect: Defect;
  connected: boolean;
  folders?: readonly RepositoryFolder[];
  onOpenFolder?: (projectId: string, folderPath: string, folderId: string | null) => void;
};

export function useDefectSourceNavigation({ workspaceId, defect, connected, onOpenFolder }: Input) {
  const http = useOptionalTmsHttpClient();
  const { locale } = useTmsLocale();
  const scope = JSON.stringify([workspaceId, defect.projectId, defect.id, connected]);
  const latest = useRef(scope); latest.current = scope;
  const request = useRef<AbortController | null>(null);
  const [state, setState] = useState({ scope: "", pending: false, error: "" });
  useEffect(() => () => { request.current?.abort(); request.current = null; }, [scope, http]);
  const canOpen = Boolean(connected && workspaceId && http && defect.sourceLocation && onOpenFolder);

  async function open() {
    if (!canOpen || !http || !onOpenFolder) return;
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setState({ scope, pending: true, error: "" });
    try {
      const destination = await resolveDefectSource(defect,
        async id => (await getTestCase(http, id, controller.signal)).data,
        async id => (await getFolder(http, { workspaceId, projectId: defect.projectId }, id, controller.signal)).data);
      controller.signal.throwIfAborted();
      if (latest.current !== scope) return;
      setState({ scope, pending: false, error: "" });
      onOpenFolder(destination.projectId, destination.folderPath, destination.folderId);
    } catch {
      if (controller.signal.aborted || latest.current !== scope) return;
      setState({ scope, pending: false, error: locale === "ru"
        ? "Исходная папка недоступна. Сохранённый путь остаётся в карточке."
        : "The source folder is unavailable. The recorded path remains in this report." });
    } finally { if (request.current === controller) request.current = null; }
  }

  return { canOpen, open, pending: state.scope === scope && state.pending,
    error: state.scope === scope ? state.error : "" };
}
