import { useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { rewriteText, writingError } from "../data/rewrite";
import type { WritingActionKind, WritingTarget } from "../model/target";

export function useWritingRequest(workspaceId: string, target: WritingTarget, ru: boolean) {
  const http = useTmsHttpClient();
  const pending = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const previous = useRef<{ action: WritingActionKind; instruction: string } | null>(null);
  useEffect(() => {
    setBusy(false); setResult(""); setError(""); previous.current = null;
    return () => { pending.current?.abort(); pending.current = null; };
  }, [workspaceId, target]);
  async function run(action: WritingActionKind, instruction = "") {
    pending.current?.abort();
    const request = new AbortController();
    pending.current = request;
    previous.current = { action, instruction };
    setError(""); setResult(""); setBusy(true);
    try {
      const markdown = await rewriteText(http, workspaceId, target.text, action, instruction, request.signal);
      if (pending.current === request && !request.signal.aborted) setResult(markdown);
    } catch (problem) {
      if (pending.current === request && !request.signal.aborted) setError(writingError(problem, ru));
    } finally {
      if (pending.current === request) { pending.current = null; setBusy(false); }
    }
  }
  function cancel() { pending.current?.abort(); pending.current = null; setBusy(false); }
  return { busy, result, error, setError, run, cancel,
    retry: () => { if (previous.current) void run(previous.current.action, previous.current.instruction); } };
}
