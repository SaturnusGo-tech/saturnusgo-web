# Case attachment save completion and author placement

## Corrected failure

The old save action committed a newly created case to workspace state before uploading its files. That changed the selected case and creation mode, clearing the detail panel's pending file list while the upload was still running. A later storage failure closed the editor, discarding the retry selection.

The case save action now publishes the saved case and closes its editor only after the upload pipeline and authoritative attachment reload finish. The application-owned checkpoint retains the created/revised resource and completed file IDs. A retry reuses that revision and stable per-file operation keys, skips completed files and retries only the final read if uploads already finished. A storage failure keeps the editor and File objects in memory. The save button cannot be submitted again while the operation is active. Pending recovery locks the submitted fields against accidental changes while allowing retry or an explicit cancel.

This is completion orchestration across the existing case and attachment APIs, not a new database transaction. The server can already contain the new revision while files are pending. Explicit cancellation or closing the browser is not a durable background-upload service. No storage bucket, authentication, redirect policy or API contract was changed.

## Progress and presentation

Each pending screenshot/file shows a blue animated bar beneath its name. The bar is indeterminate during preparation, transfer and finalization, since the existing secure fetch transport does not expose sent-byte progress. It does not invent a numeric percentage. It becomes full only after the server finalizes the attachment. Failed files remain visible with a concise status. Reduced motion disables movement. Pending files remain visible when an edited scenario or Markdown field is applied locally before the whole case is saved.

The test case author was removed from the top of the overview. It now uses the same definition-list layout as Responsible and Revision author, directly below them in the details rail. Original-case attribution and revision attribution remain distinct.

## Validation

- 24 focused attachment, checkpoint, canonical save and archived-case tests passed.
- 35 Markdown, inspector, shared-step and navigation checks passed.
- TypeScript, TMS architecture and generated API contract checks passed.
- Chrome and Playwright WebKit both passed a controlled slow-upload UI scenario with a screenshot and PDF: save disabled during transfer, second file failure retains the draft, retry issues one case write total and uploads only the failed file again.
- Browser assertions verify the bar is blue, animated and located below the filename, and the three attribution labels are ordered together. Light and dark screenshots were reviewed.

Browser evidence is under `../output/falcon-upload-progress-20260910/` from the workspace root. The fixture uses the real case save hook, panel, draft provider, step editor, attachment components and application pipeline; server/storage responses and unrelated page sections are isolated. This is not an authenticated production upload test.
