"use client";

import { useEffect, useState } from "react";

type Result<T> =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; data: T };

export function useProductDocResource<T>(
  request: ((signal: AbortSignal) => Promise<T>) | undefined,
  retainReadyFor?: object,
) {
  const [result, setResult] = useState<{
    request: typeof request;
    attempt: number;
    retainReadyFor?: object;
    value: Result<T>;
  }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    request(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ request, attempt, retainReadyFor, value: { status: "ready", data } });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setResult({ request, attempt, retainReadyFor, value: { status: "error", error } });
      },
    );
    return () => controller.abort();
  }, [request, attempt, retainReadyFor]);
  // Revalidating the same authorized target can keep its ready UI mounted until the response.
  const keepReady = request && retainReadyFor && result?.retainReadyFor === retainReadyFor && result.value.status === "ready";
  const value: Result<T> = result?.attempt === attempt && (result.request === request || keepReady)
    ? result.value
    : { status: "loading" };
  return { ...value, retry: () => setAttempt((value) => value + 1) };
}
