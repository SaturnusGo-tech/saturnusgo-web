# Large Falcon AI replacements — spacing hotfix, 2026-09-12

## Release

- Frontend source: `b1d974e383201845a1fb65a460662a86cda969fe`.
- Pages artifact: `df59c5be567e232e1ec5ca734344c7f31e719979`.
- Origin release manifest returned the exact source SHA before Worker publication.
- Worker: `f30944bd-0221-401c-a3a3-816771e0b37a`, 100% deployed at 12:25:20 UTC.
- No backend, migration, provider or credential changes.

## Reproduction and fix

The production rich editor inherited 8px top/bottom margins on every list item, while the same AI response preview used 3.5px. Heading and paragraph rules also differed between editor and read view. Long responses made the inconsistent rhythm visible throughout the document.

The shared Markdown typography now owns spacing in the editor, AI preview and saved view: 1.5 line height, 6px between paragraphs, 2px between sibling list items, 3px above nested lists and 12px/5px around headings. List indentation and markers are explicit. Headings, separate paragraphs inside list items, checkboxes and code formatting remain intact.

## Large-document verification

- Actual GPT-4.1 request: 16,494 input characters, 16,510 output characters, 342 lines, 76 list items, H1/H2/H3 and 16 HTTP/JSON code blocks. Input/output blank-line positions were identical; there were no repeated blank lines, HTML spacers or hard-break inflation. All code blocks and the existing color marker were preserved.
- Local fixture uses the real MarkdownField and ScenarioMarkdownInput components with mocked transport returning that exact live GPT-4.1 output. Light/dark editing, replacement, saved rendering and reopening kept compact paragraph/list spacing. Read view contained 27 paragraphs, 16 code blocks and no empty paragraph nodes.
- Separate production reproduction used synthetic Russian notes for 24 API checks (16,477 characters), the authenticated Falcon AI dialog and the real backend. The pre-release response was replaced into an unsaved case draft; computed styles confirmed the inherited list-margin discrepancy. No user case content was changed.
- Post-release production smoke repeated the actual AI request and **Заменить текст** flow: 24 H2 sections, 168 list items and all 24 identifier/URL pairs survived. Preview, replaced editor, applied field and reopened editor consistently used 21px body line height, 6px paragraph spacing and 2px sibling-item spacing. The editor's one terminal empty paragraph did not multiply; the read view had none. The synthetic draft was discarded by reloading the repository, without creating a test case.
- Four regression tests cover long replacement node counts, four consecutive save/edit/apply cycles, extra Markdown blank-line separators, and partial replacement with surrounding content plus Undo. No importer data mutation was needed.

## Checks

- Writing suite: 51 passed.
- Markdown field suite: 14 passed.
- TypeScript and TMS architecture: passed (1019 files).
- Worker release suite: 53 passed.
- Production static export: passed. Existing unrelated investors CSS warning remains.
- Independent CSS review found no checkbox, list numbering, nested-list or code-formatting regressions.
