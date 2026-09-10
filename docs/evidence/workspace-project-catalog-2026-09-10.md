# Workspace project catalog and import destination

Root cause: /bootstrap deliberately scopes its projects summary to the requested project. The header incorrectly treated that summary as the workspace catalog. Opening a project via portfolios merged it into memory, making the missing option appear only after navigation.

The client now loads all active workspace projects through the existing paginated /projects endpoint. There is no portfolio or unassigned filter. Missing pagination cursors, repeated cursors and responses from another workspace are rejected instead of silently presenting an incomplete list.

The import dialog independently loads the same catalog in both repository and settings entry points. Changing its project starts a fresh import session with the selected project's folders; the source file is retained. A new folder is resolved only inside the selected project. Project changes are disabled during normalization and after writes begin, including partial/retry states.

Validation:
- 28 project catalog and import tests passed.
- 9 existing project/case navigation regression tests passed.
- Chromium and WebKit UI fixture tests passed: switching projects while an old folder request is pending, retaining the source file, importing into a selected project's existing folder, correct folder and case mutation scope, and locking project selection during writes.
- TypeScript and architecture passed (888 files).
- The temporary fixture was removed; production data was not modified by the tests.
