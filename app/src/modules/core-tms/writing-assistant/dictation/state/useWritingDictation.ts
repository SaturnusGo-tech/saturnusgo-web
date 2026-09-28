import { useEffect, useRef, useState } from "react";
import { useOptionalTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import type { WritingTarget } from "../../model/target";
import { maximumInstructionCharacters as limit } from "../../model/limits";
import { createAudioRecording } from "../application/createAudioRecording";
import { transcribeDictation } from "../data/transcribe";
import type { DictationState } from "../model/errors";
import { dictationError } from "./messages";

export function appendDictation(base: string, speech: string, maximumCharacters = limit) {
  const words = speech.trim();
  const complete = base + (words && base && !/\s$/.test(base) ? " " : "") + words;
  return { value: complete, overLimit: complete.length > maximumCharacters };
}

export function useWritingDictation({ instruction, onChange, ru, enabled, workspaceId, target,
  contextKey, purpose = "writing", maximumCharacters = limit }: {
  instruction: string; onChange: (value: string) => void; ru: boolean; enabled: boolean;
  workspaceId: string; target?: WritingTarget; contextKey?: string;
  purpose?: "writing" | "documentation"; maximumCharacters?: number;
}) {
  const http = useOptionalTmsHttpClient();
  const [state, setState] = useState<DictationState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
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
  function cancel() { dispose(); setState("idle"); setLevel(0); }
  useEffect(() => { cancel(); setError(""); setNotice(""); }, [workspaceId, target, contextKey, purpose, http]);
  useEffect(() => { if (instruction.length <= maximumCharacters) setNotice(""); }, [instruction, maximumCharacters]);
  useEffect(() => dispose, []);
  useEffect(() => { if (!enabled) cancel(); }, [enabled]);
  useEffect(() => {
    const hide = () => { if (document.hidden) cancel(); };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  function start() {
    if (!enabled || !http || recording.current || pending.current) return;
    setError(""); setNotice("");
    if (latest.current.instruction.length >= maximumCharacters) {
      setError(ru ? "Сократите команду перед следующей диктовкой." : "Shorten your command before dictating more."); return;
    }
    const base = latest.current.instruction, id = ++generation.current;
    setState("starting"); setElapsed(0); setLevel(0);
    const current = () => id === generation.current;
    recording.current = createAudioRecording({
      onReady: () => { if (current()) setState("listening"); },
      onElapsed: (seconds) => { if (current()) setElapsed(seconds); },
      onLevel: (value) => { if (current()) setLevel(value); },
      onProcessing: () => { if (current()) setState("transcribing"); },
      onError: (problem) => {
        if (!current()) return;
        recording.current = null; setState("idle"); setError(dictationError(problem, ru));
      },
      onComplete: (wav) => {
        if (!current()) return;
        recording.current = null;
        const request = new AbortController(); pending.current = request;
        void transcribeDictation(http, workspaceId, wav, request.signal, purpose).then((text) => {
          if (!current() || request.signal.aborted) return;
          if (latest.current.instruction !== base) {
            setError(ru ? "Команда уже изменена. Продиктуйте дополнение ещё раз." : "The command has changed. Dictate your addition again."); return;
          }
          const next = appendDictation(base, text, maximumCharacters);
          latest.current.onChange(next.value);
          if (next.overLimit) setNotice(ru
            ? `Вся диктовка сохранена. Сократите текст до ${maximumCharacters.toLocaleString("ru")} символов перед отправкой.`
            : `Full dictation preserved. Shorten the text to ${maximumCharacters.toLocaleString("en")} characters before sending.`);
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
  return { state, elapsed, level, active: state !== "idle", error, notice, start, cancel, stop };
}
