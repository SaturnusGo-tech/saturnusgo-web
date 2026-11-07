"use client";

import { useEffect, useState } from "react";

type Result<T> =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: T };

export function useProductDocResource<T>(request: ((signal: AbortSignal) => Promise<T>) | undefined) {
  const [result, setResult] = useState<{
    request: typeof request;
    attempt: number;
    value: Result<T>;
  }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    request(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ request, attempt, value: { status: "ready", data } });
      },
      () => {
        if (!controller.signal.aborted) setResult({ request, attempt, value: { status: "error" } });
      },
    );
    return () => controller.abort();
  }, [request, attempt]);
  const value: Result<T> = result?.request === request && result?.attempt === attempt
    ? result.value
    : { status: "loading" };
  return { ...value, retry: () => setAttempt((value) => value + 1) };
}
