"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { createSelfProfileClient } from "../../../../profile/self/data/profile-client";
import type { SelfProfile } from "../../../../profile/self/domain/profile-model";
import type { ManagedAvatarLoader } from "../../../managed/domain/managed-avatar";

type Identity = { name: string; hasAvatar: boolean; version: number };
type Snapshot = { subject: string; identity: Identity; accountKind?: SelfProfile["accountKind"] };

/** Optional identity presentation. Authentication and tenant permissions stay with the session. */
export function useSelfProfileIdentity(http: TmsHttpClient, subject: string, fallback: Identity, active = true) {
  const client = useMemo(() => createSelfProfileClient(http), [http]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const sequence = useRef(0);
  const grant = useRef<{ subject: string; version: number; avatar: SelfProfile["avatar"] } | null>(null);
  const current = snapshot?.subject === subject ? snapshot : null;
  const profile = current?.identity ?? fallback;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController(), request = ++sequence.current;
    void client.read(controller.signal).then(value => {
      if (controller.signal.aborted || request !== sequence.current) return;
      grant.current = { subject, version: value.version, avatar: value.avatar };
      setSnapshot({ subject, identity: { name: value.name, hasAvatar: value.hasAvatar, version: value.version }, accountKind: value.accountKind });
    }).catch(() => { /* An optional profile read must never interrupt an authenticated workspace. */ });
    return () => controller.abort();
  }, [active, client, subject]);

  const updateProfile = useCallback((identity: Identity) => {
    sequence.current++;
    grant.current = null;
    setSnapshot(value => ({ subject, identity, accountKind: value?.subject === subject ? value.accountKind : undefined }));
  }, [subject]);
  const avatarLoader = useCallback<ManagedAvatarLoader>(async signal => {
    const existing = grant.current;
    if (existing?.subject === subject && existing.version === profile.version && existing.avatar
      && Date.parse(existing.avatar.expiresAt) > Date.now() + 5_000) return existing.avatar;
    const value = await client.read(signal);
    if (signal.aborted) return null;
    grant.current = { subject, version: value.version, avatar: value.avatar };
    return value.avatar;
  }, [client, profile.version, subject]);

  return { profile, accountKind: current?.accountKind, updateProfile, avatarLoader };
}
