"use client";
import { useEffect, useState } from "react";
import type { ManagedAvatarLoader } from "../../domain/managed-avatar";

export function useManagedAvatarUrl(load: ManagedAvatarLoader | undefined, hasAvatar: boolean, version?: number) {
  const [state, setState] = useState<{ load: ManagedAvatarLoader; version?: number; url: string } | null>(null);
  useEffect(() => {
    if (!load || !hasAvatar) { setState(null); return; }
    const controller = new AbortController();
    load(controller.signal).then((grant) => {
      if (controller.signal.aborted || !grant) return;
      const url = new URL(grant.url);
      if (url.protocol === "https:" && !url.username && !url.password) setState({ load, version, url: url.toString() });
    }).catch(() => { if (!controller.signal.aborted) setState(null); });
    return () => controller.abort();
  }, [load, hasAvatar, version]);
  return hasAvatar && state !== null && state.load === load && state.version === version ? state.url : null;
}
