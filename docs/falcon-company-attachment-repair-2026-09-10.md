# Company file upload and step attachment display

## Confirmed faults

The R2 bucket allowed browser requests from the legacy TMS address and three older origins, but none of the company addresses. Managed API logs showed repeated successful upload-intent responses (201), with no finalization. A PUT preflight returned 403 for Umbrella and 204 for the legacy TMS address. The file therefore never reached finalization or the step's ready attachment projection.

Separately, the case step viewer rendered saved attachments but the step editor omitted them. The editor now uses the same saved-attachment renderer as the viewer. Shared-step editing retains its own supplied attachment controls.

## Storage repair

Updated the private bucket CORS policy with exact origins from all six verified Falcon Worker domain bindings. Existing allowed origins, methods, headers and exposed ETag remain intact. No wildcard origin, public bucket access or authentication changes were introduced. The applied configuration is in `infrastructure/cloudflare/tms-origin/storage/attachment-cors.json`.

An isolated Chromium page at each allowed origin performed a real presigned image PUT, read the exposed ETag, downloaded the image, and decoded its pixels. All six passed. Each generated probe object was deleted and its absence verified. No project, case or employee records were changed by this storage check.

R2 CORS is independent of API CORS. New company domains must be added to this exact-origin policy and verified with a browser PUT before handing over access. The current domain provisioning token cannot edit bucket CORS; this repair used the existing operator authorization. Domain creation itself was not changed in this patch.

Provider reference: https://developers.cloudflare.com/r2/buckets/cors/ . Presigned requests still require the browser origin in the bucket policy.

## Validation

The saved attachment rendering regression failed before the UI fix and passed afterward. It covers photographs and other files, switching between viewing and editing, empty steps and shared-step non-duplication. Attachment transport/orchestration tests passed, including finalization retry, expiry and credential isolation. Typecheck, architecture and generated API contract checks passed.

Production browser storage evidence and the previous CORS configuration are retained under `../output/falcon-attachments-20260910/`. Browser probes exercise actual storage with an isolated test document; they do not impersonate an authenticated Falcon user or prove a user draft was saved.
