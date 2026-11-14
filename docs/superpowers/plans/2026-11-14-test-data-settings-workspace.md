# Test Data Settings Workspace

The selected Postman screenshots define the composition: a compact resource tree on the left and a restrained editor or full-width data table on the right. Falcon's existing product tokens, rounded neutral controls and stable anchored overlays remain authoritative.

## Implementation order

1. Add project-scoped Settings → Test Data, preserving the existing direct TDM route and using the same provider and screen.
2. Replace the flat resource table/modal navigation with a bounded two-pane workspace. Each catalog owns its cancellation, pagination, search and retry. Categories disclose smoothly; content changes use short opacity/translation motion with reduced-motion support.
3. Reuse real dataset and credential operations in inline editors. Keep unsaved-change protection, immutable versions, permissions and local-only secret form state. Case-level dialogs remain supported without changing their behavior.
4. Show safe metadata, dataset version fields, usage and lifecycle actions in the right panel. Preserve historical version selection and prevent stale resource responses during rapid navigation.
5. Resolve the source/view/query backend scope separately: current datasets are typed field maps; no tabular source, SQL or external connector contract exists. Do not manufacture sources from fields or fake query results. Standalone Static Data also needs an additive catalog contract.
6. Verify new navigation/state interactions, existing TDM behavior, architecture limits, lint/typecheck/contracts and production build. Inspect actual preview screenshots for dark/light, creation, existing resource, expanded tree, loading/error, keyboard focus and narrow viewport. Record visual comparison findings before release.

## Reference measurements

Left resource pane: roughly 25% of the TDM workspace, with compact 36px category and 34px resource rows. Subtle one-pixel dividers; no cards. Right header: 48–54px. Metadata form: readable column, max 760px, with 28–36px section spacing. Data tables use available pane width and scroll independently. Inputs use Falcon control fill, 12–13px radius and neutral outer focus. No inner outlines. Modal positioning and visibility have one owner.

## Contract constraints

No secret values in navigation, shared state, persistent browser storage or generic authoring history. No client-side reimplementation of authorization or dataset version policy. Existing case-level bindings and dataset versions keep their meaning. New API work requires checked OpenAPI/generated clients, scoped PostgreSQL transactions and real persistence tests.
