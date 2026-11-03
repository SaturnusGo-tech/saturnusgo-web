# Falcon production release and documentation refresh

User requirement: publish all accumulated interface changes first, then replace every active documentation screenshot using the authenticated production Umbrella account. No synthetic UI preview captures. Update all 47 articles in English and Russian.

## Release 1: interface

- Published interface source: `38c7171d380d7a08339e66628e6503cf195e520c`.
- Published selector-contrast correction: `2799394472056bc7031d474a5967dee8a9885578`.
- Both releases were verified live before their respective screenshots. Each capture retains its actual release SHA; captures made before the contrast release are not relabelled.
- Publish from a clean detached release worktree, preserving shared Pages content and all company bindings.
- Verify live release SHA, runtime assets, font delivery and production interface before any documentation capture.

## Documentation

- Audit all article text, walkthroughs, navigation and captions against the current interface.
- Capture actual production states at a 1728 × 1117 logical viewport with 2× device scale (3456 × 2234 raster).
- Use English UI for English guidance and Russian UI for Russian guidance.
- Retain raw captures and provenance: source URL, timestamp, locale, viewport, release SHA and image hash.
- Do not manufacture connected states, successful results or approvals. Use existing data and unsaved drafts; record any unavailable state explicitly.
- Preserve stable article/section anchors and historical media aliases referenced by saved AI answers.
- Replace the active edition through a typed production capture registry. A strict complete gate must reject any remaining legacy active image, absent source, wrong locale or wrong dimensions.
- Regenerate the paired backend guide corpus only after the complete catalog and media are valid.

## Release 2: documentation

- Validate locale parity, links, images, provenance, catalog and corpus tests, TypeScript and architecture.
- Publish the completed documentation and paired corpus through their existing scoped release workflows.
- Verify new assets and articles in production. Restore temporary capture viewport overrides.

Parallel ownership: root releases and all authenticated browser captures; API agent English media/captions; Swagger agent bilingual prose and paired backend corpus; portfolio agent Russian media, capture infrastructure and completeness validation. Child agents could not access the authenticated browser, so root performed both locale capture passes.

## Evidence and limitations

- Source captures, DOM sidecars, timestamped state URLs, validation logs and release records are retained in the workspace output directory `output/falcon-docs-refresh-20261103/`.
- Captures use existing production records or explicitly cancelled, unsaved forms. No case/run/result/defect was created, no external API request executed and no OAuth grant issued for an illustration.
- The owner activated Codex during the capture pass. Final Codex illustrations use the resulting actual active state; this task did not activate the employee or create that grant.
- Unavailable OAuth consent, provider installation and newly generated QA-result states are explained in text without fabricated success screenshots. Historical completed results are labelled as existing results.
- MacBook Pro 16 viewport coverage is an emulated layout/capture format, not physical-device validation.
- Publish frontend image assets before deploying the matching statically loaded guide corpus to the two explicitly identified production API services. The local Railway default points to Codex Lab and must never be used for this release.
