import { useEffect, useRef, useState } from "react";
export function useDataCommand() {
  const replay = useRef<{ identity: string; key: string } | null>(null);
  const current = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null);
  useEffect(() => () => current.current?.abort(), []);
  async function execute<T>(action: (signal: AbortSignal, key: string) => Promise<T>, identity = "default") {
    if (current.current) return { ok: false as const };
    if (replay.current?.identity !== identity) replay.current = { identity, key: crypto.randomUUID() };
    const key = replay.current.key;
    const controller = new AbortController(); current.current = controller;
    setPending(true); setError(null);
    try {
      const result = await action(controller.signal, key);
      if (!controller.signal.aborted) replay.current = null;
      return controller.signal.aborted ? { ok: false as const } : { ok: true as const, value: result };
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure && typeof failure === "object" && "code" in failure && typeof failure.code === "string" ? failure.code : "REQUEST_FAILED");
      return { ok: false as const };
    } finally { if (!controller.signal.aborted) { current.current = null; setPending(false); } }
  }
  return { execute, pending, error, clearError: () => setError(null) };
}
