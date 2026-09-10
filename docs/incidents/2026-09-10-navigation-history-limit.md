# Navigation crash when the browser history write limit is reached

The SaturnusGo company reported a full client-side application error on navigation,
including entering the dashboard. The browser console identified:

`SecurityError: Attempt to use history.replaceState() more than 100 times per 10 seconds`

## Cause

Repository, dashboard, suite and report navigation shared a history context writer.
Saving scroll position or filter/search state replaced the current browser history
entry even though its URL had not changed. The workspace scroll observer also saved
on every wheel event, bypassing its scroll-event throttle. Each changing position
therefore consumed a native History API write. Removing Next's internal markers
for these context-only writes additionally triggered unnecessary router updates.
Once the browser budget was exhausted, a subsequent state write or navigation could
throw through the application and render Next's generic client-exception screen.

## Correction

UI context is now stored separately in session storage, keyed by the navigation
session and history-entry index. Reads overlay the current entry's latest context.
Native history writes are reserved for real URL navigation and initial entry setup.
Context writes no longer dispatch Next router updates. Same-URL setup retains Next's
internal markers; real URL changes still synchronize its canonical URL.

Back/Forward and reload restore the latest scroll/filter state. Branching after Back
replaces discarded forward-entry context. Existing native history context remains
readable. If session storage is unavailable or full, the current tab retains bounded
in-memory UI context; no server data or authorization behavior is changed.

## Validation

- A regression using the installed Next native-history wrapper and a 100-write
  browser budget failed before the fix with the reported SecurityError.
- After the fix, 600 changing UI-context writes followed by dashboard navigation
  consume only initialization, navigation and the router's subsequent commit.
- Back/Forward, new branches, reload, session isolation, corrupt storage and blocked
  storage have regression coverage.
- Local browser verification performed 600 scroll and 600 search-context updates,
  then opened the real dashboard component without a console exception.
- Adapter/organization tests: 612 passed. Managed-access tests: 23 passed.
  Authentication/media tests: 50 passed. Worker/deployment tests: 53 passed.
- Typecheck, architecture checks and generated OpenAPI compatibility passed.

An existing crashed browser tab must be reloaded after deployment to load the fixed
JavaScript. The original authenticated failing tab was not available to automation;
the user's console message supplied the production diagnostic.
