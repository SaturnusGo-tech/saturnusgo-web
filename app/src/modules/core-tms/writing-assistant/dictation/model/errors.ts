export type DictationState = "idle" | "starting" | "listening" | "transcribing";
export type RecordingError = "not-allowed" | "audio-capture" | "unavailable" | "startup-timeout" | "too-short" | "silent";
export class DictationFailure extends Error {
  constructor(readonly code: RecordingError) { super(code); this.name = "DictationFailure"; }
}
export function recordingError(error: unknown) {
  if (error instanceof DictationFailure) return error;
  const name = error && typeof error === "object" && "name" in error ? error.name : "";
  return new DictationFailure(name === "NotAllowedError" || name === "SecurityError" ? "not-allowed"
    : name === "NotFoundError" || name === "NotReadableError" || name === "OverconstrainedError" ? "audio-capture" : "unavailable");
}
