# Folder and portfolio interface review — 9 September 2026

## Brief and references

Approved flow: workspace → optional portfolio → project → repository folders → existing Falcon case editor. The subsequent user correction takes precedence over the generated mockups: softer icons and dialogs, case leaves in the tree, cross-folder selection, and no alternate case creator.

References: `../output/falcon-folders-design-20260909/01-tree-dark.png`, `02-create-folder-light.png`, `03-import-dark.png`, `04-move-cases-light.png`, `07-create-project-dark.png`, `09-project-overview-dark.png`. The proposed `10-create-case-dark.png` was explicitly rejected and is not implemented.

## Visual review

Desktop evidence: 1536 × 1024, actual local Falcon UI with production API composition and an isolated PostgreSQL workspace. Reference and implementation images were inspected together for tree, import and project creation. Actual screenshots are retained in `.design-qa/organization-qa/` and published, without retouching, as `public/falcon/docs/2026-09/organization-*.jpg`.

| Area | Actual capture | Result |
| --- | --- | --- |
| Folder tree and case leaves | `folder-tree-ru.png` | Soft duotone folder icons; existing case list and toolbar retained; desktop tree widened to 328 px. |
| Create subfolder | `folder-create-ru.png` | Rounded dialog, neutral focus treatment, full destination path before save. |
| Cross-folder selection | `folder-selection-ru.png` | Two cases from separate branches share one bulk action bar. |
| Move selected cases | `folder-move-ru.png` | One destination picker, hierarchical options, count and explicit confirmation. |
| Import preview | `folder-import-preview-ru.png` | Real hierarchy, existing/new folders and explicit empty-folder state; three draft cases successfully imported. |
| Archive branch | `folder-archive-ru.png` | Confirmation explicitly distinguishes recoverable archive from unfiling. |
| Portfolio and project | `catalog-ru.png`, `portfolio-ru.png`, `project-create-ru.png`, `project-overview-ru.png` | Calm table layout, soft icons, existing project dialog and canonical case entry. |
| Narrow repository | `folder-mobile-ru.png` | 390 × 844; tree stacks above the existing horizontally scrollable case table. Folder dialog controls remain reachable. |

Dark and light themes were inspected. The application shell and canonical test-case creator remain shared across entry points. These are intentional adaptations of the reference to the user's request, rather than a second design system.

## Functional checks

- Created a durable empty nested folder through the UI.
- Selected cases from different folders and moved four cases in one operation; unfiled one case without deleting it.
- Archived and restored a three-case branch. Fixed missing archived summaries and disabled drag attributes interfering with navigation. Archived cards now open in the canonical inspector with editing and execution disabled.
- Imported three complete draft cases and six folders, including an empty folder, through the actual file chooser and API.
- Opened the existing canonical creator from the tree with its selected folder prefilled.
- Browser Back returned from a case to its exact folder URL. Fixed Next.js history state handling that previously restored a stale URL.
- The actual installed PointerSensor is covered by tests at 259/260 ms, early motion and release. Native browser automation exposes only immediate drag, so a physical held gesture was not claimed as a browser-tested action.

## Release check

Full backend suite: 570 passing tests. Migration rehearsal and production migration preserve the complete existing case, revision, run and attachment digests. Frontend final release logs and production verification are recorded in the sibling `release-evidence/falcon-folders-portfolios-2026-09-09/` directory.

Final visual and flow review: **PASS**. The portfolio → previously unloaded PAY project → canonical empty repository → canonical creator → Back journey was repeated in the browser after the metadata-loading fix. The header, URL and visible cases now agree on the selected project; previous-project cases are not substituted. Production build and deployment results are recorded in the release evidence.
