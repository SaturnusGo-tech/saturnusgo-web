"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProfileMediaKind, SelfProfile, SelfProfileDetails, SelfProfilePort } from "../domain/profile-model";

export function useSelfProfile(client: SelfProfilePort) {
  const [profile, setProfile] = useState<SelfProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState(false);
  const [revision, setRevision] = useState(0);
  const mutation = useRef<AbortController | null>(null);
  const read = useRef<AbortController | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; mutation.current?.abort(); }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    read.current = controller;
    setLoading(true); setError(null);
    client.read(controller.signal).then(value => { if (!controller.signal.aborted) setProfile(value); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); if (read.current === controller) read.current = null; };
  }, [client, revision]);
  const execute = useCallback(async (operation: (signal: AbortSignal) => Promise<SelfProfile>) => {
    if (mutation.current) return false;
    read.current?.abort(); read.current = null; setLoading(false);
    const controller = new AbortController(); mutation.current = controller;
    setPending(true); setError(null); setNotice(false);
    try {
      const value = await operation(controller.signal);
      if (!controller.signal.aborted && alive.current) { setProfile(value); setNotice(true); return true; }
    } catch (reason) { if (!controller.signal.aborted && alive.current) setError(reason); }
    finally { if (mutation.current === controller) mutation.current = null; if (alive.current) setPending(false); }
    return false;
  }, []);
  return { profile, loading, pending, error, notice,
    retry: () => setRevision(value => value + 1),
    save: (details: SelfProfileDetails) => profile ? execute(signal => client.update(profile, details, signal)) : Promise.resolve(false),
    upload: (kind: ProfileMediaKind, file: File) => profile ? execute(signal => client.upload(profile, kind, file, crypto.randomUUID(), signal)) : Promise.resolve(false),
    chooseCharacter: (characterId: string) => profile ? execute(signal => client.chooseCharacter(profile, characterId, crypto.randomUUID(), signal)) : Promise.resolve(false),
    remove: (kind: ProfileMediaKind) => profile ? execute(signal => client.remove(profile, kind, signal)) : Promise.resolve(false),
  };
}
