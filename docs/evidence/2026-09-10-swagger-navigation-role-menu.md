# Swagger navigation and administration role menu

The API Testing sidebar entry now requires an enabled Swagger connection in the selected
workspace and project as well as the existing company entitlement. A single workspace
catalog owns the connection state for both the sidebar and Hooks. Saving, disabling or
disconnecting a connector updates that catalog immediately; subsequent refreshes reconcile
it with the server. Initial loading, errors and disconnected workspaces do not expose the
entry. Switching projects cannot reuse another project's Swagger visibility.

Removed the external Postman tab and updated the Swagger/API Testing help articles.
Existing direct links still provide the Swagger setup/error screen when appropriate.

The administration shell now supplies the semantic surface/text/focus tokens consumed by
the shared select. Role and owner selectors have opaque themed menus with the existing
rounded corners, keyboard navigation and selection behavior.

Validation: 738 adapter/organization/managed/auth/worker tests passed, TypeScript and
architecture checks passed, generated API contract is unchanged. The catalog regression
covers one shared request, initial absence, save, project switching, disconnection, disabled
connections, cancelled stale responses, tenant switching, failures and missing entitlements.
The actual CreateMember component was inspected in a temporary local browser fixture in
both themes; selecting Observer worked and both menus were opaque. The fixture was removed.
Production build and rollout evidence follows after publication.
