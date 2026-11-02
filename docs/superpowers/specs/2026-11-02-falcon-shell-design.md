# Falcon shell and settings design

User request: implement the supplied four Codex/ChatGPT desktop screenshots as the visual authority for Falcon shell, header, hover menus and settings. The user explicitly delegates detailed design decisions and asks to begin implementation. Previous audit is retained separately without expanding this change into all audit fixes.

## Direction
Operate mode. Remove floating navigation/content frames, outer corner radii and wallpaper gaps. Keep Falcon product content and brand mark. Reference geometry at 2x: 44px header, 52px collapsed rail with 36px controls and 8px side insets, 240px expanded/category sidebar, 24px official OpenAI SVG icons, 12–16px popover radii. Dark surfaces: canvas #181818, rail #242424, category sidebar #202020 and subtle neutral separators; keep working light theme and stored user theme.

Main navigation: dashboard, cases, shared steps, runs, suites, reports, plus explicit pins. Portfolios/custom fields/API/hooks remain available in hover ellipsis with capability checks. Account avatar hover menu holds profile, settings, admin where permitted, help/contact, sign out. Bell/avatar remain in rail. Hover opens without stealing focus; click/touch/keyboard, Escape/outside dismissal and pointer travel tolerance required.

Header retains history and current scope. Remove global environment/build selectors; far right official square-plus opens environments settings using existing route/reset flow. Move run timer and platform build downloads to run context so functional access remains.

Settings: category/search sidebar, selected states and wide left-aligned content with 40px desktop gutters. The user accepted the navigation but rejected the first implementation's card-heavy interiors. The final direction uses flat related rows, thin separators, labels and descriptions on the left, and compact controls or actions on the right. Avoid separate rounded cards and repeated headings inside each settings page.

Appearance has two rows for theme and language, with 34px native selectors. Account has identity and sign-out rows. General project settings show name, key, description, responsible person, portfolio and status as property rows, with the existing inline editor and ETag save contract. Notifications retain their existing channel/preference behavior in flat rows. Import remains inside the settings shell with compact upload/destination controls and file history. Environments retain the existing list and compact inline editor. Keep URLs, permissions, English/Russian content, import/export and notifications available.

## Approach
Chosen under user's delegated implementation: refactor existing React presentation components and scoped CSS. Use @openai/apps-sdk-ui0.2.2 icon components only, no global library styles. Reject screenshot-as-UI and wholesale component-system replacement because controls must remain functional and current architecture stable. No backend/schema/access changes.

## Constraints and verification
Existing isolated frontend worktree at 0766ea813, branch `codex/falcon-chatgpt-shell-20261102`. Handwritten TS/TSX <=200 lines, <=2 code files/directory, no transport implementation imports from presentation. Functional tests cover navigation capabilities/pins, hover/focus, settings search, environment navigation and run-level operational controls, including empty filtered results. Run typecheck, architecture and a production export build.

The local preview uses a synthetic read-only API at 127.0.0.1:4573; it neither proxies production credentials nor persists writes. Browser verification covers desktop, narrow viewports, light/dark and hover menus. First-pass screenshots precede the user's flat-interior correction and are not final acceptance evidence. Twelve final settled captures of revised interiors, menus and mobile states passed independent visual review; final browser error log was empty. Save/sign-out remain outside end-to-end preview verification. Four detector warnings refer to layout transitions in navigation/legacy shell styles; they are not a zero-warning result. Deliver local review first; no production publication requested in this task.
