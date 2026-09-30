import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { formatTmsMutationFailure, toTmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { getProject } from "../../data/project-api";

type Input = { projectId: string; enabled: boolean; offline: boolean; errorText: string };
type Resource = { data: Project; etag: string | null };

export function useProjectSettingsEditor({ projectId, enabled, offline, errorText }: Input) {
  const http = useTmsHttpClient();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const active = useRef<AbortController | null>(null);
  const close = useCallback(() => {
    active.current?.abort(); active.current = null;
    setResource(null); setLoading(false); setError("");
  }, []);
  useEffect(() => {
    close();
    return () => { active.current?.abort(); active.current = null; };
  }, [http, projectId, enabled, offline, close]);

  const load = useCallback(async () => {
    close();
    if (!projectId || !enabled || offline) return;
    const controller = new AbortController(); active.current = controller;
    const current = () => active.current === controller && !controller.signal.aborted;
    setLoading(true);
    try {
      const result = await getProject(http, projectId, controller.signal);
      if (current()) setResource(result);
    } catch (caught) {
      if (current()) setError(formatTmsMutationFailure(toTmsMutationFailure(caught), errorText));
    } finally {
      if (current()) { active.current = null; setLoading(false); }
    }
  }, [http, projectId, enabled, offline, errorText, close]);

  return { loading, error, resource, load, close };
}
