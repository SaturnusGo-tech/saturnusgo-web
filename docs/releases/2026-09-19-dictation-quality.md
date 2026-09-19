# Falcon AI dictation quality, 2026-09-19

The recorder, AudioWorklet and WAV encoder now support up to five minutes. The client sends
only audio, with no interface-language hint, and no longer cancels dictation when the interface
language changes. Physical keyboard layout is not read by this feature.

Capture requests automatic gain control and disables browser noise suppression, which can
affect whispers. Processing preserves every sample and pause, rejects only a flat signal, and
applies a bounded uniform gain to very quiet recordings before PCM conversion. Loud recordings
are not amplified. The worklet URL is versioned to avoid a cached 60-second capture limit.

Recognized text is appended in full. Custom commands support 16,000 characters; if combined
typed and dictated text exceeds the limit, all text remains visible for shortening and sending
is disabled. Dictation never submits a writing request or changes the source document by itself.
The manual review, cancellation, stale response and microphone cleanup behavior is preserved.
The in-product Falcon AI documentation has been updated without provider implementation copy.

The Worker changes only the dictation route: 12,810,000-byte body and 130-second upstream timeout.
The checked backend contract and generated client transport are synchronized. The Pages readiness
test also follows the already-published September 13 YouTrack video filename.

## Validation

- Writing assistant tests: 108 passed, including quiet audio, long pauses, mixed text, language
  changes during recording/transcription, long commands, 300-second worklet and encoder limits.
- Worker tests: 54 passed. Typecheck and architecture checks passed.
- The actual browser panel and capture pipeline were exercised with synthetic microphone audio
  and live transcription. Russian speech in an English interface passed. A 182-second capture
  preserved the full 3,507-character instruction, all 18 distinct requirements and its final
  PDF requirement. Each scenario sent one transcription request and ended every media track.
- Additional live samples covered five languages, a mixed-language command, a synthesized
  whisper, very soft and loud speech. A near-inaudible, heavily quantized sample remained
  inaccurate, and the one-word sample had a typo. The user's physical microphone and macOS
  keyboard switching are not validated by a synthetic browser stream.

Evidence: workspace `output/falcon-dictation-quality-20260919`. Provider model and cost controls
remain unchanged; there is no expensive fallback or automatic retry.

Deploy both updated APIs first, publish the production static build, wait for its release
manifest, then deploy the Worker. Verify the served worklet and the complete production route.
Rollback restores the corresponding API, Pages and Worker versions. No schema migration or
customer data change is part of this release.
