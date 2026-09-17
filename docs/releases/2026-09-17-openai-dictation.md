# OpenAI dictation for Falcon AI instructions

Replaces browser SpeechRecognition with explicit microphone capture and server transcription.
The interface records only after a click, stops at 60 seconds, releases microphone tracks on
stop/cancel/close/navigation, then transcribes the recording through the authenticated workspace
API. Recognized text is appended to the current instruction for review; submission and applying
the AI suggestion remain explicit. Failures and cancelled/stale requests preserve typed text.

Browser capture uses a same-origin AudioWorklet and band-limited mono PCM16/16kHz WAV encoding.
Both sample count and recording timer enforce the limit. Silence/short recordings are rejected
locally; the backend independently verifies format, measured duration and editing permissions.
The client uses the generated DictationRequest/DictationResult contract. Old SpeechRecognition
adapters and tests have been removed. The OpenAI key remains exclusively on the backend.

The production Worker previously blocked microphone access with `microphone=()`. The reviewed
policy is now `microphone=(self)`; user permission is still required. Only the dictation endpoint
gets the 2,570,000-byte JSON allowance and 70-second upstream timeout. Other API limits remain.
Incoming request cancellation propagates upstream. Custom domain bindings are preserved by the
existing release workflow.

Validation: writing tests (88 passed), Worker tests (54 passed), TypeScript and architecture
checks. Real browser AudioWorklet captured a synthetic Russian sentence, produced validated WAV
and closed its AudioContext; the actual OpenAI model correctly transcribed that output. The real
panel's idle, recording and transcribing states were visually checked in a synthetic fixture.
No customer audio was recorded; physical microphone behavior requires the user's permission.

Backend prerequisite: umbrella-home-tms-backend source 651f3cc. Schema remains0060. Default
server budget100 minutes/member/workspace/calendar month and five requests/member/minute is
configurable; the client does not expose credentials or enforce the authoritative quota.
Publish Pages, wait for matching release.json, then deploy the Worker before announcing
availability. Rollback restores the corresponding Pages/Worker and API versions; no product
records are modified by dictation.
