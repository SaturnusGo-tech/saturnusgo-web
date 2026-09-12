# Suite and defect repository consistency — 2026-09-12

Suite catalog, detail and settings use compact controls aligned with the existing repository. Launch actions are circular and blue. Detail and settings share the actual folder tree and case search/QL/filter controls used by run creation. Title, description and membership open on tap. Description uses the existing Markdown editor, including Falcon AI. Field cancellation restores the previous value. Saved hidden/unloaded case IDs and advanced dynamic rules survive changes to other suite fields; text-based rules use the existing paginated server search. Suite search/filter state survives opening a case and returning.

Reports group defects by the stored component in the selected project. This is the component recorded on the defect, not a guessed folder or product. An empty component has a separate “Без компонента” section. Scoped server aggregates provide total, open and open-critical counts across all matching records. Component pages and record pages are bounded and independently expandable. Search matches key, title, description, component, labels and scoped responsible identity/name/email. Severity sorting is performed on the server before pagination. Old query responses cannot replace newer results; background updates preserve the loaded extent.

The defect detail uses a labeled “Ссылка на дефект” copy action and a correctly centered circular Play action. Discussion spans the entire detail width below content/properties with a larger editing area. The redundant comment refresh control is removed; live updates and failure retries remain available.

## Compatibility and rollout

The backend adds GET /api/v1/defects/groups and optional search/component/severity-sort parameters to the existing defects list. Publish the compatible backend before the frontend. No migration is required; schema remains at 0058. The notification worker behavior is unchanged. Existing case revisions, run snapshots, results and customer records are not rewritten. Generated client types come from the current .tms-folders-backend OpenAPI contract.

## Validation

Frontend adapter/documentation gate: 460 tests passed; organization regression gate: 196 passed; writing/Markdown: 51 passed. Typecheck and architecture (1,054 files) passed. The maintained adapter gate includes the new suite rule/selection/editing/preview tests and defect browser pagination/concurrency tests.

Local browser checks used actual components and isolated fixture data/transport: suite catalog, detail folder tree, settings selection, tap-to-edit title/description, cancellation, Markdown/Falcon AI presence, dark/light reports, English labels, multiple component branches and query-aware counts, defect link/Play alignment, full-width discussion with no reload control, and layouts at 900px and 420px. CSS container queries cross module boundaries through the nearest container so narrow rows wrap correctly. No production records were modified.

The backend release note records real PostgreSQL checks for 1,200 defects, tenant isolation, scoped member search, sorting/pagination, wildcard literals and long Unicode cursors. Background refresh retains loaded pages; stale/aborted responses and inherited-property component names are covered.

## Production publication

Published on 12 September 2026. Runtime source commits:

- Frontend: `47cf36b2bc2145685ab020d256a529d5eb064183`.
- Backend: `b171cad63c30ca996b86763f4cf2b9360e799026`.
- Pages: `bf4de06f7d061ae4682343397d68f22beeb415b3`; the public origin release manifest returns the frontend source SHA above.
- Cloudflare Worker: `14db5dde-2f73-4d8c-b427-3389df747823`, deployed to 100% at 18:00:39 UTC. All seven existing domains were verified. The Worker gate passed 53/53 tests.
- Railway primary API deployment: `4b584f79-142d-4d48-9caa-7b20e91b5d2f` (SUCCESS).
- Railway managed API deployment: `d9ab1285-e360-452d-8208-d8cdb3a04ecc` (SUCCESS).

Both API health endpoints returned HTTP 200. Production static export and origin readiness checks passed. No migration was run and the notification worker was unchanged.

Authenticated production browser verification on Umbrella-Host confirmed all 25 defects in ten component groups, 23 open and zero open-critical defects. Searching `HOST-BUG-025` returned one record in its component with totals of one. Clearing the search restored the browser. Multiple sections expanded independently. The detail showed the labeled defect link, centered round Play, a full-width 741px comment editing area in the tested viewport and no comment reload control or page horizontal overflow.

The existing “Смоук релиза — обзор Falcon” suite rendered its 100 cases in repository folders. Settings rendered the full 409-case repository tree and opened title/description editing on tap; the description exposed Markdown headings and “Спросить Falcon AI”. Settings were cancelled without saving. Production verification did not create runs, defects or comments and did not change customer records.

Subsequent documentation-only commits do not change these published runtime source SHAs.
