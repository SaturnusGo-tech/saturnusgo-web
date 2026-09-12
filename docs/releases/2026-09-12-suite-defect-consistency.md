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
