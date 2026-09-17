export type DictationState = "idle" | "starting" | "listening" | "stopping";
export type DictationError = "not-allowed" | "service-not-allowed" | "audio-capture" | "network"
  | "no-speech" | "language-not-supported" | "unavailable" | "startup-timeout" | "unknown";
export type DictationTranscript = { final: string; interim: string };

export interface DictationResult {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: { readonly transcript: string };
}
export interface DictationResultEvent {
  readonly resultIndex: number;
  readonly results: ArrayLike<DictationResult>;
}
/** Structural types support both SpeechRecognition and webkitSpeechRecognition. */
export interface DictationRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: DictationResultEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export type DictationRecognitionConstructor = new () => DictationRecognition;
export type DictationSchedule = (callback: () => void, delayMs: number) => () => void;

export function dictationError(code: string): DictationError {
  if (code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture"
    || code === "network" || code === "no-speech" || code === "language-not-supported") return code;
  if (code === "bad-grammar" || code === "language-unavailable") return "language-not-supported";
  return "unknown";
}
