"use client";
import { useEffect, useState } from "react";
import type { ProfilePeriod, SelfProfileActivity, SelfProfilePort } from "../domain/profile-model";

export function useProfileActivity(client: Pick<SelfProfilePort, "activity">, workspaceId: string | null, days: ProfilePeriod) {
  const key = `${workspaceId ?? ""}:${days}`;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ key: string; value: SelfProfileActivity | null; error: unknown; loading: boolean }>({ key, value: null, error: null, loading: true });
  useEffect(() => {
    const controller = new AbortController();
    if (!workspaceId) { setState({ key, value: null, loading: false, error: null }); return; }
    setState({ key, value: null, loading: true, error: null });
    client.activity(workspaceId, days, controller.signal)
      .then(value => { if (!controller.signal.aborted) setState({ key, value, loading: false, error: null }); })
      .catch(error => { if (!controller.signal.aborted) setState({ key, value: null, loading: false, error }); });
    return () => controller.abort();
  }, [client, workspaceId, days, key, revision]);
  return { ...(state.key === key ? state : { value: null, error: null, loading: true }), retry: () => setRevision(value => value + 1) };
}
