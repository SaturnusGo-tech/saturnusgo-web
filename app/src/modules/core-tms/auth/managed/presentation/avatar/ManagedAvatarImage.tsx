"use client";
import { useState } from "react";
import type { ManagedAvatarLoader } from "../../domain/managed-avatar";
import { useManagedAvatarUrl } from "../../application/avatar/useManagedAvatarUrl";

export function ManagedAvatarImage({ name, hasAvatar, load, version, className }: {
  readonly name: string; readonly hasAvatar: boolean; readonly load?: ManagedAvatarLoader;
  readonly version?: number; readonly className?: string;
}) {
  const url = useManagedAvatarUrl(load, hasAvatar, version);
  const [failed, setFailed] = useState<string | null>(null);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className={className} aria-hidden="true" style={{ overflow: "hidden" }}>
    {url && failed !== url ? <img src={url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(url)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : initials || "QA"}
  </span>;
}
