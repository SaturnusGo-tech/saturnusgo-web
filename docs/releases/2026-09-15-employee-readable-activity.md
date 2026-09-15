# Readable employee activity

Replaces the administrative event table with activity grouped by local calendar day. Public object keys remain visible; internal identifiers, action codes and request references are in closed details. Known infrastructure events and unknown action types remain available in a separate collapsed service group per day. All loaded events and pagination are retained. No audit records or permissions change. Event state is no longer passed to the account-status badge.

The unselected employee view uses a transparent generated illustration on the page background. Asset: public/falcon/illustrations/employee-directory.png. Created with built-in imagegen; final edit prompt: Keep the three profile silhouettes and cobalt/slate/lavender palette. Remove glow, haze, blur and illumination. Crisp flat fills on fully transparent background, no new objects; small professional empty-state artwork.

Verification: typecheck, architecture and 31 managed tests pass. Synthetic browser verification covers readable activity, service disclosure, light theme and unselected empty state.
