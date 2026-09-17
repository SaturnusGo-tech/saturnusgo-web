import { dictationError, type DictationError, type DictationRecognition, type DictationSchedule,
  type DictationState, type DictationTranscript } from "../model/recognition";
import { readDictationTranscript } from "../model/transcript";

type Options = {
  recognition: () => DictationRecognition;
  language: string;
  onState: (state: DictationState) => void;
  onTranscript: (transcript: DictationTranscript) => void;
  onError: (error: DictationError) => void;
  maxDurationMs?: number;
  stopTimeoutMs?: number;
  startupTimeoutMs?: number;
  schedule?: DictationSchedule;
};
const scheduleTimer: DictationSchedule = (callback, delay) => {
  const timer = setTimeout(callback, delay);
  return () => clearTimeout(timer);
};

/** A single recording. Create a fresh session to start another recording. */
export function createDictationSession(options: Options) {
  const schedule = options.schedule ?? scheduleTimer;
  let recognition: DictationRecognition | null = null;
  let state: DictationState = "idle";
  let started = false, ended = false;
  let transcript: DictationTranscript = { final: "", interim: "" };
  let cancelStartup: (() => void) | undefined;
  let cancelDuration: (() => void) | undefined;
  let cancelStop: (() => void) | undefined;

  function setState(next: DictationState) {
    if (next !== state) { state = next; options.onState(next); }
  }
  function publish(next: DictationTranscript) {
    if (next.final === transcript.final && next.interim === transcript.interim) return;
    transcript = next;
    options.onTranscript(next);
  }
  function finish(abortRecognition: boolean, publishFinal = true) {
    if (ended) return;
    ended = true;
    cancelStartup?.(); cancelDuration?.(); cancelStop?.();
    const current = recognition;
    recognition = null;
    if (current) {
      current.onstart = null; current.onend = null; current.onresult = null; current.onerror = null;
      if (abortRecognition) { try { current.abort(); } catch { /* Already stopped. */ } }
    }
    if (publishFinal) publish({ final: transcript.final, interim: "" });
    setState("idle");
  }
  function fail(error: DictationError) {
    if (ended) return;
    finish(true);
    options.onError(error);
  }
  function stop() {
    if (!started || ended) return;
    if (state === "starting") { finish(true); return; }
    if (state !== "listening") return;
    cancelDuration?.();
    setState("stopping");
    cancelStop = schedule(() => finish(true), options.stopTimeoutMs ?? 1500);
    try { recognition?.stop(); } catch { finish(true); }
  }
  function start() {
    if (started || ended) return;
    started = true;
    setState("starting");
    try { recognition = options.recognition(); }
    catch { fail("unavailable"); return; }
    recognition.lang = options.language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      if (ended || state !== "starting") return;
      cancelStartup?.();
      setState("listening");
      cancelDuration = schedule(stop, options.maxDurationMs ?? 60000);
    };
    recognition.onresult = (event) => {
      if (!ended) publish(readDictationTranscript(event));
    };
    recognition.onerror = (event) => {
      if (ended) return;
      if (event.error === "aborted" || (event.error === "no-speech" && transcript.final)) finish(true);
      else fail(dictationError(event.error));
    };
    recognition.onend = () => finish(false);
    cancelStartup = schedule(() => fail("startup-timeout"), options.startupTimeoutMs ?? 60000);
    try { recognition.start(); }
    catch (error) {
      const name = error && typeof error === "object" && "name" in error ? error.name : "";
      fail(name === "NotAllowedError" || name === "SecurityError" ? "not-allowed"
        : name === "NotFoundError" ? "audio-capture" : "unknown");
    }
  }
  return { start, stop, abort: () => finish(true, false) };
}
