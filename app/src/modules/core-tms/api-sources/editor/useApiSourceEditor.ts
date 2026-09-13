import { useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { saveApiSource } from "../data/api-source-api";
import { sourceDraft, type ApiSource } from "../model/api-source";
export function useApiSourceEditor(workspaceId: string, projectId: string, source: ApiSource | null, onSaved: (source: ApiSource) => void) {
  const http = useTmsHttpClient(); const [draft, setDraft] = useState(() => sourceDraft(source, projectId));
  const [pending, setPending] = useState(false); const [error, setError] = useState<unknown>(null);
  const controller = useRef<AbortController | null>(null); const key = useRef("");
  useEffect(() => () => controller.current?.abort(), []);
  async function save() {
    if (controller.current) return;
    key.current ||= crypto.randomUUID(); const request = new AbortController(); controller.current = request;
    setPending(true); setError(null);
    try {
      const result = await saveApiSource(http, workspaceId, source, draft, key.current, request.signal);
      if (!request.signal.aborted) onSaved(result);
    } catch (failure) { if (!request.signal.aborted) setError(failure); }
    finally { if (!request.signal.aborted) { controller.current = null; setPending(false); } }
  }
  return { draft, setDraft, pending, error, save };
}
