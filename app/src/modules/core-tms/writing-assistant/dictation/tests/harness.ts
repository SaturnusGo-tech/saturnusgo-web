import { createDictationSession } from "../application/createDictationSession";
import type { DictationError, DictationRecognition, DictationResultEvent, DictationState,
  DictationTranscript } from "../model/recognition";

export class FakeRecognition implements DictationRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 0;
  onstart: DictationRecognition["onstart"] = null;
  onend: DictationRecognition["onend"] = null;
  onerror: DictationRecognition["onerror"] = null;
  onresult: DictationRecognition["onresult"] = null;
  starts = 0;
  stops = 0;
  aborts = 0;
  startFailure: unknown;
  stopFailure: unknown;
  start() { this.starts++; if (this.startFailure) throw this.startFailure; }
  stop() { this.stops++; if (this.stopFailure) throw this.stopFailure; }
  abort() { this.aborts++; }
}
export function result(parts: [string, boolean][], resultIndex = 0): DictationResultEvent {
  return { resultIndex, results: parts.map(([transcript, isFinal]) => ({ 0: { transcript }, length: 1, isFinal })) };
}

export function harness(settings: { factoryFailure?: boolean; startFailure?: unknown } = {}) {
  const recognition = new FakeRecognition();
  recognition.startFailure = settings.startFailure;
  const states: DictationState[] = [], transcripts: DictationTranscript[] = [], errors: DictationError[] = [];
  let now = 0, nextId = 0;
  const timers = new Map<number, { time: number; callback: () => void }>();
  const session = createDictationSession({
    recognition: () => { if (settings.factoryFailure) throw new Error("Unavailable"); return recognition; },
    language: "ru-RU",
    onState: (state) => states.push(state),
    onTranscript: (text) => transcripts.push(text),
    onError: (error) => errors.push(error),
    maxDurationMs: 60000, startupTimeoutMs: 10000, stopTimeoutMs: 1500,
    schedule: (callback, delay) => {
      const id = ++nextId;
      timers.set(id, { time: now + delay, callback });
      return () => { timers.delete(id); };
    },
  });
  function advance(ms: number) {
    const until = now + ms;
    while (true) {
      const next = [...timers.entries()].filter(([, timer]) => timer.time <= until)
        .sort((a, b) => a[1].time - b[1].time)[0];
      if (!next) break;
      now = next[1].time; timers.delete(next[0]); next[1].callback();
    }
    now = until;
  }
  return { session, recognition, states, transcripts, errors, advance, timers };
}
