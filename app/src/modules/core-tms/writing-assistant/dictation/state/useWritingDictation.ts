import { useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import type { WritingTarget } from "../../model/target";
import { createAudioRecording } from "../application/createAudioRecording";
import { transcribeDictation } from "../data/transcribe";
import type { DictationState } from "../model/errors";
import { dictationError } from "./messages";

const limit = 2000;
export function appendDictation(base: string, speech: string) {
  const words = speech.trim();
  const complete = base + (words && base && !/\s$/.test(base) ? " " : "") + words;
  return { value: complete.slice(0, limit).replace(/[\uD800-\uDBFF]$/, ""), truncated: complete.length > limit };
}

export function useWritingDictation({ instruction, onChange, ru, enabled, workspaceId, target }: {
  instruction: string; onChange: (value: string) => void; ru: boolean; enabled: boolean;
  workspaceId: string; target: WritingTarget;
}) {
  const http = useTmsHttpClient();
  const [state, setState] = useState<DictationState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const recording = useRef<ReturnType<typeof createAudioRecording> | null>(null);
  const pending = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const latest = useRef({ instruction, onChange }); latest.current = { instruction, onChange };
  function dispose() {
    generation.current += 1;
    recording.current?.abort(); recording.current = null;
    pending.current?.abort(); pending.current = null;
  }
  function cancel() { dispose(); setState("idle"); }
  useEffect(() => { cancel(); setError(""); setNotice(""); }, [workspaceId, target, ru]);
  useEffect(() => dispose, []);
  useEffect(() => { if (!enabled) cancel(); }, [enabled]);
  useEffect(() => {
    const hide = () => { if (document.hidden) cancel(); };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  function start() {
    if (!enabled || recording.current || pending.current) return;
    setError(""); setNotice("");
    if (latest.current.instruction.length >= limit) {
      setError(ru ? "В команде уже 2000 символов." : "The command already has 2,000 characters."); return;
    }
    const base = latest.current.instruction, id = ++generation.current;
    setState("starting"); setElapsed(0);
    const current = () => id === generation.current;
    recording.current = createAudioRecording({
      onReady: () => { if (current()) setState("listening"); },
      onElapsed: (seconds) => { if (current()) setElapsed(seconds); },
      onProcessing: () => { if (current()) setState("transcribing"); },
      onError: (problem) => {
        if (!current()) return;
        recording.current = null; setState("idle"); setError(dictationError(problem, ru));
      },
      onComplete: (wav) => {
        if (!current()) return;
        recording.current = null;
        const request = new AbortController(); pending.current = request;
        void transcribeDictation(http, workspaceId, wav, ru ? "ru" : "en", request.signal).then((text) => {
          if (!current() || request.signal.aborted) return;
          if (latest.current.instruction !== base) {
            setError(ru ? "Команда уже изменена. Продиктуйте дополнение ещё раз." : "The command has changed. Dictate your addition again."); return;
          }
          const next = appendDictation(base, text);
          latest.current.onChange(next.value);
          if (next.truncated) setNotice(ru ? "Диктовка сокращена до лимита 2000 символов. Проверьте команду." : "Dictation was trimmed to the 2,000-character limit. Review the command.");
        }).catch((problem) => {
          if (current() && !request.signal.aborted) setError(dictationError(problem, ru));
        }).finally(() => {
          if (current()) { pending.current = null; setState("idle"); }
        });
      },
    });
    recording.current.start();
  }
  function stop() {
    if (state === "starting" || state === "transcribing") cancel();
    else void recording.current?.stop();
  }
  return { state, elapsed, active: state !== "idle", error, notice, start, cancel, stop };
}
