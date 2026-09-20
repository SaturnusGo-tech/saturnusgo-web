# Compact test-case properties

The shared case inspector displays placement, metadata and additional facts as label/value rows, with values aligned to the edit actions on the right. Metadata editing uses the same row layout. Tags and revision notes each have an independent, keyboard-focusable horizontal scroll area instead of wrapping into tall blocks. Existing data, editors and permissions are unchanged.

Validation: TypeScript and TMS architecture checks passed; 25 existing inspector tests passed. Browser preview of the actual inspector components was checked in light/dark themes, at 780px and the default 1087px viewport, including property editing and keyboard horizontal scrolling. Tags measured 481px of content in a 317px region and scrolled to the end (164px); the revision note measured 630px in a 317px region.

Deployment status: implemented locally; not published by this task.
