import { useEffect, useRef, useState } from "react";
import type { WritingTarget } from "../../model/target";
import { createDictationSession } from "../application/createDictationSession";
import type { DictationRecognition, DictationState } from "../model/recognition";
import { dictationError } from "./messages";

type RecognitionWindow = Window & {
  SpeechRecognition?: new () => DictationRecognition;
  webkitSpeechRecognition?: new () => DictationRecognition;
};
const limit = 2000;
export function appendDictation(base: string, speech: string) {
  const words = speech.trim();
  return (base + (words && base && !/\s$/.test(base) ? " " : "") + words).slice(0, limit);
}

export function useWritingDictation({ instruction, onChange, ru, enabled, workspaceId, target }: {
  instruction: string; onChange: (value: string) => void; ru: boolean; enabled: boolean;
  workspaceId: string; target: WritingTarget;
}) {
  const [state, setState] = useState<DictationState>("idle");
  const [error, setError] = useState("");
  const session = useRef<ReturnType<typeof createDictationSession> | null>(null);
  const generation = useRef(0);
  const confirmed = useRef(instruction);
  const latest = useRef({ instruction, onChange }); latest.current = { instruction, onChange };
  function dispose() {
    generation.current += 1;
    session.current?.abort(); session.current = null;
  }
  function cancel() {
    if (session.current) latest.current.onChange(confirmed.current);
    dispose(); setState("idle");
  }
  useEffect(() => {
    cancel(); setError("");
  }, [workspaceId, target, ru]);
  useEffect(() => dispose, []);
  useEffect(() => { if (!enabled) cancel(); }, [enabled]);
  useEffect(() => {
    const hide = () => { if (document.hidden) cancel(); };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);

  function start() {
    if (!enabled || session.current) return;
    setError("");
    const browser = window as RecognitionWindow;
    const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
    if (!Recognition || !window.isSecureContext) { setError(dictationError("unavailable", ru)); return; }
    if (latest.current.instruction.length >= limit) {
      setError(ru ? "В команде уже 2000 символов." : "The command already has 2,000 characters."); return;
    }
    const base = latest.current.instruction;
    confirmed.current = base;
    const id = ++generation.current;
    session.current = createDictationSession({ recognition: () => new Recognition(), language: ru ? "ru-RU" : "en-US",
      onState: (next) => {
        if (id !== generation.current) return;
        setState(next);
        if (next === "idle") { latest.current.onChange(confirmed.current); session.current = null; }
      },
      onTranscript: ({ final, interim }) => {
        if (id !== generation.current) return;
        confirmed.current = appendDictation(base, final);
        const draft = appendDictation(base, [final, interim].filter(Boolean).join(" "));
        latest.current.onChange(draft);
        if (draft.length >= limit) {
          setError(ru ? "Достигнут лимит: 2000 символов." : "The 2,000-character limit has been reached.");
          session.current?.stop();
        }
      },
      onError: (code) => { if (id === generation.current) setError(dictationError(code, ru)); },
    });
    session.current.start();
  }
  return { state, active: state !== "idle", error, start, cancel, stop: () => session.current?.stop() };
}
