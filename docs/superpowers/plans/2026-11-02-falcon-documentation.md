# Falcon documentation and AI chat

## Approved direction

The user requested rounded top corners on the main workspace panel, an OpenAI Docs-like documentation experience, and a separate ChatGPT-like Falcon AI tab. Implement locally in the existing isolated frontend worktree. Preserve content, localization, authorization, APIs and existing AI features. No production publication in this iteration.

## Visual reference

Inspected live https://developers.openai.com/api/docs and its Quickstart article on 2026-11-02. Dark background #000; reference OpenAI Sans font assets recorded in public/fonts/falcon-docs/SOURCES.md. Navigation is text-first, 220px wide, with 14px labels and neutral selected backgrounds. Article text is16px/25.6px, lead18px/29px, h1 30px/42px and h2 20px/26px. Reading measure760px, right table of contents, quiet callouts and useful copy/link controls. Adapt reference navigation to real Falcon content rather than reproducing unrelated OpenAI product links.

## Implementation

- [x] Round only top corners of the main stage16px; keep header/rail background continuous.
- [x] Restyle documentation navigation, articles, search, tables, callouts and walkthrough media.
- [x] Add Documentation/Falcon AI header links. Bare Help opens introduction; returning to Docs restores last article/section, returning to AI preserves conversation/message/share.
- [x] Give AI its own history/sidebar and central conversation/composer layout; preserve streaming, stop/retry, dictation, hot-message send, citations, screenshots, shared links and history management.
- [x] Include local reference font files for the documentation surface; retain the rest of Falcon's typography.
- [x] Preserve English/Russian content, capability-filtered articles and existing backend contracts.
- [x] Run fresh integrated architecture (1545 files), TypeScript and129 guide/content/navigation regression checks; all passed.
- [x] Inspect desktop/mobile articles, empty search, chat, table of contents, image enlargement and Escape in a separate browser tab. The synthetic API is read-only; real provider generation and production mutations were not executed.
- [x] Save final desktop/mobile captures in the parent workspace `output/falcon-documentation-20261102/screenshots/`. Independent visual confirmation passed without further changes. No deployment or merge.

## Validation notes

The first render exposed inherited legacy blue links. Scoped compatibility variables now keep documentation links neutral, without modifying other Falcon surfaces. The hidden mobile history sidebar originally fetched unnecessarily; its query now starts disabled and follows measured sidebar visibility with observer cleanup. Regressions cover that gate and the existing mobile history control.

The local Next preview was restarted with a3072MiB heap limit for this8GB development machine after hot compilation triggered its memory threshold. This changes only the detached local preview process, not repository build configuration. The API remains synthetic and read-only. Prepare the generated guide corpus alongside a later backend release when publishing these content/navigation changes.

## Constraints

Handwritten TS/TSX files <=200lines; <=2codefiles/directory. Keep presentation independent of transport/data implementations. Existing content and image shared-element behavior stay intact. Backend and AI provider changes are outside this design request. Local synthetic API is read-only; it cannot verify real generation or production mutations.
