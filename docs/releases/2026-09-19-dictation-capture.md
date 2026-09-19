# Falcon AI microphone capture, 2026-09-19

The follow-up addresses live microphone capture after a user reported missing speech and a
one-word transcript. Earlier generated-audio tests did not validate the user's physical
microphone in WebKit.

## Changes

- Start the recording UI only after the first audio samples arrive. Resume the audio context
  again after obtaining microphone access; fail a stalled input startup after eight seconds.
- Request microphone audio without echo cancellation, noise suppression or automatic gain.
  Do not require unsupported settings to appear in WebKit's `getSettings()` response.
- Cancel interrupted or stalled capture instead of submitting an incomplete command. Mute,
  context suspension and 2.5 seconds without sample delivery are treated as interruptions.
  Real pauses contain samples and are retained.
- Preserve the first and final batches. Prevent phase-opposed stereo channels from cancelling
  each other when producing mono audio.
- Display captured time in tenths of a second and a live microphone level indicator in both
  themes. Language and keyboard layout remain independent of capture and transcription.
- Update the Falcon AI documentation with recording readiness and microphone feedback.

## Verification

Regression coverage includes delayed and muted startup, unresolved initial `resume`, the
second resume after microphone permission, startup timeout, interruptions, stalled sample
delivery, pauses between phrases, final flush, stereo cancellation, quiet audio, the live
level indicator and timer. These tests use controlled audio or fake hardware, not human speech.

The reported 401 at 16:21:47 GMT+5 was an unauthenticated `curl/8.7.1` probe from our previous
verification. The user's WebKit dictation at 16:26:12 returned 200 and uploaded approximately
five seconds of PCM data. No authentication or backend changes are included in this release.

A local diagnostic page is available for a separate physical-microphone comparison. It saves
only timing and signal-level measurements, not audio. A physical speech recognition result
must be recorded separately; automated tests do not establish its success.
