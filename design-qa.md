## Minimal shell insets · 26 September 2026

User approved production publication including the preceding dark-surface and sidebar-motion refinement.

- Desktop shell padding2px on every side; sidebar/workspace gap4px, identical in both themes.
- Mobile shell sides/top2px, open navigation reservation64px; bottom rail58px at bottom2px, gap4px. Collapsed reservation2px.
- Live 883×695: sidebar x2/y2/height691; workspace x74/y2/right881/bottom693; no document horizontal overflow.
- 14 existing presentation, motion and repository-width checks passed. Independent review found no blocker. Worker/backend/dependencies unchanged.

## Dark surface, density and sidebar motion refinement · 26 September 2026

Local preview only; follows production source `3ca2cee2d`.

- Shared outer padding: 12→6px; pane gap: 12→8px; repository header top inset: 18→12px; shell header side inset: 20→14px. Typography unchanged.
- Dark wallpaper base #161617 with subdued neutral gradients; dark page/panel tokens use the existing suite canvas #111113. Elevated controls retain a distinct #19191c surface.
- Sidebar desktop layout has one flex-basis transition. Row icon anchors, utility positions and the 38px toggle height remain stable. Circle/pill uses the same radius; profile/admin labels fade without display toggles. Mobile bottom navigation is preserved.
- Live 1440×900: sidebar x/y6, height888; collapsed buttons40×40; expanded width240. Both themes inspected. Suite canvas remains rgb(17,17,19).
- Recorded collapse: 50 frames, width240→68 with intermediate values; icon x30, utilities y716, toggle y847 stay constant. Expanded final width240 confirmed. Opening frame capture timed out; no opening frame-rate claim.
- 680×800: no document horizontal overflow; mobile nav labels remain hidden with no rotation.
- Reduced-motion emulation: sidebar/container/item/toggle transition durations all0s. Emulation restored.
- Typecheck, architecture1207files,14 existing presentation/motion/repository-width tests and diff whitespace checks passed.
- Admin/profile geometry reviewed in code; local session does not display managed account links. Safari was not separately exercised.
- Screenshots and collapse-frame evidence: `../output/falcon-depth-spacing-20260926/`.

# Нейтральная палитра и навигация · 2026-09-26

**final result: passed** для локального просмотра уточнений пользователя. Предыдущий glass v1 опубликован с исходным кодом `adc9ad4aa1ae62ee6dc0ca74c89c848ac8202f5b`; изменения ниже проверены на стенде и в этот релиз не входят.

- Светлая тема: нейтральный фон, монохромные иконки, круглая активная кнопка. Снимок: `../output/falcon-neutral-refinement-20260926/repository-initial.png`.
- Тёмная тема: чёрные поверхности на более светлом фоне. Снимки: `repository-dark.png`, `dashboard-dark.png` в том же каталоге.
- Геометрия тем при 1440×900 совпадает: сайдбар и рабочая поверхность начинаются на y=12 и имеют высоту 876 px. Замеры: `geometry.json`. Хедер находится внутри общей поверхности в обеих темах.
- При 1280×800 кнопки свёрнутого сайдбара имеют размер 40×40 и радиус 50%; горизонтального переполнения нет. Проверено окно 680×800: переполнения нет, карточка и прокрутка доступны. Снимки: `repository-dark-1280.png`, `repository-dark-680.png`.
- Точка активных прогонов: 5×5, border=0, box-shadow=none. У выбранной кнопки сохранён контрастный клавиатурный фокус. Ссылки админки проверены по CSS, поскольку облачная админка отсутствует на изолированном стенде.
- В репозитории Customer Portal кнопки Verify fixes нет; в Payments с двумя готовыми исправлениями она есть. Ошибка первичной загрузки не создаёт кнопку без подтверждённой очереди; восстановление уже начатого прогона сохранено.
- Пройдены 38 тестов проверки исправлений, 23 существующих проверки навигации/ширины/представления, TypeScript, архитектура 1207 файлов, разбор шести изменённых CSS-файлов, `git diff --check`. Консоль стенда без ошибок. Отдельная Safari-проверка и полный регрессионный прогон не выполнялись.

---

# Архив: первоначальный glass, проверка до публикации · 2026-09-26

Ветка `experiment/glass-workspace`, отдельный worktree `.tms-glass-frontend`. Область: общая оболочка, репозиторий, карточка кейса и дашборд. На момент первоначальной проверки production не был изменён. Позднее пользователь отдельно одобрил публикацию glass v1.

**final result: passed** для локального просмотра утверждённых экранов. Проверка не является разрешением на production или полным регрессионным прогоном Falcon.

## Источники и изображения

- Светлая тема: `../output/falcon-glass-experiment-20260925/01-pearl-workspace.png`, выбранный вариант 1.
- Тёмная тема: уточнённый вариант 3, `/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/exec-c667e793-9cf9-427e-b7e8-0c762226f10e.png`. Графит, серебристые и холодные светлые оттенки; выраженный фиолетовый исключён по просьбе пользователя.
- Снимки приложения: `../output/falcon-glass-experiment-20260925/qa/`. Для текущего состояния использовать файлы `*-final.png` и `repository-dark-reference-size.png`. Старый `repository-dark-1440.png` содержит ошибочно обрезанный снимок и не является доказательством проверки.
- Приложение использует настоящие локальные API и данные стенда. Названия, язык и количество записей отличаются от концептов; это проверка композиции и поведения при реальных данных, а не утверждение о полном совпадении пикселей.

## Проверенные состояния

| Проверка | Результат и доказательство |
| --- | --- |
| Тёмная тема, 1440 × 900 | Репозиторий, выбранный кейс и фильтры визуально проверены: `repository-dark-final.png`, `filter-dark-final.png`. Длинные названия переносятся. Enter открывает выбранный кейс. |
| Светлая тема, 1440 × 900 | Репозиторий повторно проверен: `repository-light-final.png`. Фильтры и дашборд проверены в предыдущей сессии: `filter-light.png`, `dashboard-light-1440.png`, `dashboard-runs-light.png`. |
| Сравнение с выбранными вариантами | Источник и актуальная реализация просмотрены попарно: светлая 1487 × 1058, тёмная 1486 × 1065; файлы `repository-light-reference-size.png` и `repository-dark-reference-size.png`. В обоих состояниях открыт кейс. Сохранены широкие рабочие поверхности, парящий сайдбар, мягкий фон и монохромный активный пункт. Тёмный фон намеренно спокойнее исходного варианта. |
| Дашборд, тёмная тема | Вкладки Runs & risks и Work now, переход из метрики к двум дефектам, открытие и отмена каталога виджетов: `dashboard-dark-final.png`, `dashboard-work-dark-final.png`, `dashboard-drill-dark-final.png`, `dashboard-catalog-dark-final.png`. |
| Компактное окно, 680 × 800 | `repository-narrow-final.png`, `repository-tree-narrow-final.png`, `repository-narrow-collapsed-final.png`. Развёрнутая навигация: контент заканчивается на y=730, панель начинается на y=736. Свёрнутая: контент до y=794, скрытая панель начинается за экраном на y=806. Горизонтального переполнения корня нет. |
| Репозиторий и клавиатура | Проверены поиск, сброс фильтра, меню кейса, вкладки и изменение ширины стрелками клавиатуры в предыдущей сессии. Отдельный ключ ширины не меняет обычную сохранённую настройку. |

## Исправлено во время проверки

- Всплывающие панели просвечивали поверх текста. Для меню и фильтров используется непрозрачная `--glass-panel-strong`; крупные рабочие поверхности сохраняют прозрачность.
- На узком экране старый расчёт высоты `calc(100% - 60px)` и новые внешние отступы конфликтовали. Исправлена доступная высота рабочего содержимого; убран видимый край скрытой нижней панели в 6 px.
- Белые надписи и значки терялись на светло-синей заливке тёмной темы. Цвет заполненной основной кнопки отделён от акцента ссылок и фокуса; контраст белого составляет 5,10:1.
- Оформление дерева ограничено репозиторием кейсов, чтобы общие деревья выбора в прогонах и сьютах не получили новые рамки и отступы.

## Технические проверки и ограничения

- Пройдены 36 существующих целевых тестов, TypeScript, архитектурная проверка 1207 файлов, разбор 19 CSS-файлов и `git diff --check`. Это не полный регрессионный прогон продукта.
- Отдельная проверка Safari в этом эксперименте ещё не выполнена. Исторические результаты Safari ниже относятся к другим изменениям.
- Облачные профиль и админка скрыты существующим gate локальной авторизации. Внешние интеграции, AI и облачные вложения отключены на стенде и здесь не проверялись.
- При восстановлении стенда 26 сентября локальная PostgreSQL была остановлена. Возобновление её работы восстановило health и cloud-session HTTP 200 без изменения авторизации или данных. Это не дефект оформления.
- Известных P0/P1/P2 в проверенных состояниях не осталось. Плотность строк и размеры типографики сохранены ближе к действующему Falcon, чем к увеличенному концепту; счётчики, поля и данные остаются настоящими. Принятие визуального направления, следующие экраны и публикация остаются за пользователем.
- После восстановления базы ошибок уровня error в консоли проверяемой вкладки не было. Холодная компиляция Next dev при возобновлении заняла около 51 секунды; это не измерение скорости production-сборки.

---

# Архив: Repository filters and drag QA, 2026-09-23

Approved source: the **right-hand filter panel only** in
`/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/exec-1b529b3d-1d11-4d44-98f4-83f7eca034d2.png`.
The user explicitly excluded the new-folder redesign. Existing folder-dialog files have no diff against the published `a5daf101` source.

Evidence: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-filters-drag-20260923/evidence/`.
Source image and `filters-dark.png` were viewed together in the same comparison call. The source is a paired concept board; only its filter portion is relevant. Actual screenshots use native 1280 × 720 CSS px, without zoom; the layout retains Falcon's compact typography rather than scaling the whole board.

## Review result

- Layout: two columns, categories left, options right, close at top right, archive/reset below options. No nested cards or drilldown pages.
- Typography: existing Geist; 14 px panel title, 13 px navigation and options, 11–12 px secondary controls. No oversized type.
- Theme: existing Falcon tokens for graphite/light surfaces, faint edge, 16 px radius, restrained shadow, calm blue selected rows. Status/priority rings remain readable in both themes.
- Content: actual domain values replace the generated reference's fictional review status. No new statuses introduced. Existing fields and custom run filters are preserved.
- Icons: existing Lucide outline family; selected values use a separate check. Hover and selected backgrounds are independent.
- Responsive: `filters-narrow.png` verifies 390 × 600. `filters-short.png` verifies 700 × 360 with internal scrolling and reachable footer. Temporary viewport overrides were reset.
- Keyboard: vertical tab navigation, right-arrow entry into options, Escape close/focus restoration verified. Inputs and buttons retain focus indications.
- Drag: `multi-case-pickup.png` shows compact stacked preview and subdued selected source rows; `multi-case-result-dark.png` shows the destination still open after a cross-folder move.

Fixed during QA: destination could collapse when its first direct cases arrived; explicit idempotent reveal now survives data refresh. Fixed short-height popup clipping by allowing content to shrink and using full available height when neither side of the trigger has enough space.

Safari follow-up: the first Chromium-only check missed WebKit collapsing the automatic height of nested flex/grid content. Changed the body/content flex basis to `auto` and gave the grid a shrinkable row. Native Safari now renders the complete panel in light and dark themes; status selection changes the result list, category selection and the archive switch work. Evidence: `filters-safari-dark-fixed.png` and `filters-safari-light-fixed.png` (native Safari window 1024 × 768). The fixture now includes the real RepositoryControls search ancestor. Its global input-shell rule also required a scoped switch background override. Chromium 700 × 360 reports panel y=12, height=336, footer bottom=335; the viewport override was cleared. Native Safari narrow/drawer cases are a future regression checklist, not a claim of tests completed in this pass.

Verdict: **PASS for approved filters and repository drag scope, including the reported Safari clipping fix**. This is not a claim of exact whole-screen pixel parity: the reference also redesigned folder creation and the surrounding toolbar, which were excluded from this request.

---

# Previous: Import library and repository toolbar QA

Date: 2026-09-22. Local branch `feature/import-file-library`; no deployment.

## Source and evidence

Source visual truth:
`/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/exec-fb7c2741-0852-443d-a3d4-399df914ac03.png`.
The 1402 × 1122 image contains a 1402 × 952 import screen and a separate toolbar
detail below it. The detail is not a footer for the import page.

Evidence directory:
`/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-import-library-20260922/`.

- Final full-view comparison: `comparison-refined-full.png`.
- Final focused toolbar comparison: `comparison-refined-toolbar.png`.
- Final implementation: `import-refined-light.png`, `import-refined-dark.png`.
- Menu: `import-final-menu.png`.
- Final repository widths: `repository-refined-compact.png`, `repository-refined-wide.png`.
- Final dark toolbar: `repository-refined-dark.png`.
- MacBook-sized verification: `import-macbook-1280.png`.

Local URL: `http://127.0.0.1:8960/?theme=light`.
The fixture mounts production components with synthetic data and mock transports.
It is not evidence of a production deployment or a live R2 upload.

## Viewport and normalization

Final native viewport: 1087 × 701 CSS px, DPR 2, visualViewport scale 1, CSS zoom 1.
CUA screenshots are already 1087 × 701 pixels. Do not halve their dimensions because
the device reports DPR 2. Source and implementation are combined without scaling
their text. The source has a larger frame, so this is a responsive composition
comparison, not an exact full-frame pixel comparison.

A temporary 1280 × 800 viewport verified the MacBook-sized layout: heading 24 px,
filename/body 13 px, no horizontal document overflow. The override was reset
immediately afterwards. The user-facing tab uses the native window size.

The user explicitly rejected oversized type after the initial mock comparison.
That instruction supersedes the enlarged typography in the image. The compact
Falcon type scale is therefore an intentional change, not a fidelity defect.

## Comparison history and fixes

1. [P1, fixed] Initial preview depended on a forced frame and enlarged typography.
   Removed the permanent viewport override and returned the page to 13 px body,
   12 px secondary text, 18 px section headings and 24 px page title. Confirmed
   native 100% scale and the same sizes at 1280 × 800. Evidence: final light image
   and MacBook-sized image.
2. [P2, fixed] Dark mode inherited an extra rectangular input background inside
   the rounded search field. Added a scoped transparent background override.
   Evidence: `import-final-native-dark.png` after the fix.
3. [P2, fixed] Narrow repository controls left too little space for search.
   The final selection control is a compact text-only button at all widths,
   following the user's subsequent rejection of the checkbox icon. Folder
   creation has a compact icon at narrow widths. Import remains a text button.
   Evidence: both refined repository captures.
4. [P1, fixed after user feedback] The repeated Back/Repository action, inactive
   Import action and large outlined toolbar buttons added unwanted visual weight.
   Removed the back action. Import is rendered only with importable input or an
   active/retryable attempt. File selection is a 32 px pill, the blue add control
   is 29 px. Import has a soft neutral fill, New folder is unboxed with a muted
   purple icon, and Select/Done has no checkbox. Entry uses 220–240 ms opacity
   and 4 px translation, disabled for reduced motion. Final source/render
   comparisons show these intentional user-requested deviations.

## Final fidelity review

- Typography: rendered system font stack matches the existing Falcon shell;
  font synthesis is disabled by the shell. Production font assets also remain
  available in the fixture. The import page does not introduce a separate family.
  Body and secondary type remain compact across the tested widths. Primary
  actions now use 12 px type, per the latest request for smaller controls.
- Layout: upload and destination remain two clear columns on desktop, followed by
  an open file list. No nested card grid. On narrow screens the composer stacks;
  the existing shell and repository resize behavior are retained.
- Color: existing Falcon light/dark tokens, blue primary actions, muted secondary
  text, red deletion action. Both themes visually inspected after the fixes.
- Assets: existing Falcon logo and Lucide icons reused; no illustrative artwork
  added. MemberAvatar uses the real member directory; synthetic fixture members
  have initials rather than the reference's generated portraits.
- Copy: project/folder labels, source filenames, dated groups, author and actions
  correspond to the chosen design. Sample timestamps and file sizes differ.
- Interaction: synthetic JSON imported successfully; source opened; copied link
  verified by pasting into a local field; source deletion left a deleted history
  entry; menu and Escape focus behavior checked. No console warnings/errors in
  the final browser inspection.
  After the last refinement, verified that the empty screen has no Import or
  Back/Repository button, choosing a valid JSON reveals Import, and Select
  toggles the selection actions. Typecheck, architecture and production build
  passed again.

## Residual verification limits

The browser automation did not receive a download event for the fixture's Blob
URL; actual downloaded bytes were not verified through that API. Real R2 upload
and download require a separate integrated staging smoke test. These are not
visual acceptance claims. Server persistence, authorization and RLS are covered
by separate real-PostgreSQL tests.

No remaining actionable P0/P1/P2 visual findings in the inspected states.

## Implementation checklist

- [x] Repository toolbar and full-page import use the selected combined design.
- [x] Compact typography rechecked at native scale and MacBook-sized viewport.
- [x] Light/dark comparison and focused toolbar evidence saved.
- [x] Temporary viewport override reset.
- [x] Local tab retained for review; no production publication.

final result: passed

## Settings and notifications — 2026-09-27

Scope: local glass workspace, settings and notification screens. No deployment.
The user’s later corrections take precedence over the initial mockup: existing
Geist typography, original theme previews, unboxed language/account/environment
sections, and notifications accessible separately from settings.

### Sources and comparison

- Light notification reference: `/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/exec-79e1e660-aa45-470f-a159-729c70896958.png`.
- Dark notification reference: `/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/exec-dd37df16-d202-4ff7-b8bd-dc06bf884731.png`.
- Captures: `/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/settings-redesign-20260927/`.
- Dark reference and `notifications-dark-final.png` inspected in the same image
  comparison. Rounded sections, thin neutral outlines, channel controls and
  two-column preferences retained. Serif heading intentionally replaced per
  user correction. Actual unavailable delivery channels show their real state.
- `notifications-light-mixed.png` verifies light on/off states;
  `notifications-dark-mixed.png` verifies dark on/off states.
- Final settings captures: `appearance-light-final.png`,
  `appearance-dark-final.png`, `account-dark-final.png`,
  `environments-light-final.png`. Rejected environment layout retained as
  `environments-before.png` for comparison.
- Desktop 1366×900, narrow 883×695, compact 600×800 inspected. Temporary viewport
  override reset. Narrow screenshots: `appearance-dark-narrow.png`,
  `notifications-dark-narrow.png`, `exchange-dark-narrow.png`.

### Findings addressed

1. P1: global dark input styling hid enabled switches. Native input remains
   keyboard accessible; a separate track/thumb span now supplies its visuals.
   Enabled dark track is #ededed with #171717 thumb; disabled/off is distinct.
2. P1: decorative fonts and unnecessary disclosure sections. Removed custom
   font assets and returned to Geist (computed font-style normal). Direct
   setting rows replace disclosures where there are no secondary options.
3. P2: over-boxed appearance/language/account. Restored original theme previews,
   simple radio choices for language, and plain account identity/sign-out row.
4. P2: environment row showed a copy icon even with an empty URL. Now URL and
   copy render together only for a nonempty address. Plain rows with small
   edit/archive icon actions replace the large card and action buttons.
5. P2: removing the notifications shortcut from settings could remove compact
   access. Kept its global navigation button visible, including compact mode,
   and supplied an explicit accessible name.

### Verification

- Theme changes, English/Russian radio selection, project/environment edit
  dialogs and cancellation, and import navigation exercised locally.
- Notification category toggled off, persisted through reload, then restored
  using Space. Accordion collapse/expand checked with click and Enter.
- All six preferences restored to their initial enabled state. No external
  messages delivered. Browser push/Telegram delivery is disabled on this stand;
  those live delivery flows were not tested here.
- No horizontal document overflow at 883 or 600 CSS px. No captured console
  errors. Source review preserved archive/restore, export and sign-out callbacks;
  destructive/account actions were not executed in the shared browser session.
- Typecheck, architecture check (1207 files), notification worker test and
  `git diff --check` passed. Production build/deployment not run for this review.

No remaining actionable P0/P1/P2 findings in the inspected states.

final result: passed

## Compact run header, option 3 — 2026-09-27

### Scope and source

Selected reference: `/Users/mercuryrucks/.codex/generated_images/01a07862-f88a-7701-bf0e-179ddf13e9b1/exec-98df9b8d-b2c7-42d5-aeeb-faf87c0ebad9.png` (1660 × 948).
The full-width run overview is replaced with compact platform build actions in
its existing global header and an anchored “About run” action by the run selector.
The popover contains only run owner and description. Existing case assignees,
execution controls, fonts, navigation and data models are preserved. Wall-clock
and date are removed from the global header; the execution timer remains.

### Visual comparison

Source and final implementation were opened together at 1660 × 948.
Final captures are in
`/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-compact-run-20260927/`:

- `light-desktop-final.png`: 1660 × 948; compact 52 px header, platform actions,
  restored execution area and 300 px owner/description popover.
- `dark-laptop.png`: 1366 × 768; readable neutral controls and popover with the
  same structure as light mode.
- `dark-narrow.png`: 600 × 800; header wraps, both builds remain reachable and
  the popover stays within the viewport.

Checked hierarchy, spacing, typography, color/contrast and interaction states.
Existing product font sizes and real project/case data intentionally replace the
illustrative reference text. The captured mobile-build run is a draft, so its
execution footer is absent by existing behavior; an active run was also checked.
P2 found during comparison: the selector's flexible width pushed “About run”
too far right. Fixed the selector sizing and aligned execution actions right;
final capture shows the popover beside the selector without covering case text.

### Behavior and validation

- Open/close, close button, Escape with focus return, outside click, and bounded
  scrolling checked. Long descriptions use the existing safe Markdown renderer.
- Active-run owner Anna Taylor remains separate from case assignee Noah Davis.
- iOS-only and Android + iOS runs checked. No full attachment name, raw download
  URL, tags or large overview in the execution header.
- Download grant is requested once for repeated clicks; request cancellation,
  client replacement, retryable 401/403/500 errors and unsafe access responses are
  covered by tests. Storage navigation opens separately, preserving Falcon.
- Typecheck and architecture gate passed; build/owner/download tests 26/26,
  run/navigation/filter tests 19/19, Markdown tests 2/2; git diff --check passed.
- Local attachment access returned 200, but this browser could not reach the
  local HTTPS storage host. End-to-end file download is deferred to the existing
  production smoke fixture after deployment; TLS settings are unchanged.
- No captured UI console errors. No production data was changed for this review.

No remaining actionable P0/P1/P2 visual findings in the inspected states.

final result: passed

## Managed custom fields and run editing — 2026-09-27

Scope follows the supplied seven Custom Fields screenshots: flat catalog rows,
compact definition/value forms, anchored search/create menus, neutral Falcon
colors and existing typography. Built-in Product group, Product and Regression
replace component entry; the dashboard and repository use stable value IDs.
Historical components remain readable as unclassified Products.

Browser evidence is in
`/Users/mercuryrucks/Desktop/SaturnusGo-Universe/output/falcon-custom-fields-20260927/`:
`catalog-light.png`, `field-editor-light.png`, `case-similar-value-dark.png`,
`run-owner-dark.png`, `run-selector-edit-light.png`, `run-editor-light.png`.
The final selector screenshot supersedes the earlier header/pencil position.

At 1280 × 720, verified both themes, catalog creation, value creation, case
creation with Product group/Product/Regression=false, explicit similarity
warning and choosing the existing value, vector folder path, and combined
Product + false filtering returning only the saved case. Created standalone
String field and Beta value through the UI; actor/time and persisted value shown.

Edited an active demo run's iOS reference to 3.0.1 (302) and owner to Emma Wilson.
Header and About run refreshed; the selected case remained assigned to Noah
Davis. The pencil now appears only beside the selected run in its dropdown,
before the checkmark. Copy-key and revision labels are absent from execution.
About run remains beside case status/assignee. An overlay stacking issue found
in review was fixed with the existing AppOverlay host; the global header no
longer overlaps the editor. No horizontal document overflow in these captures.

Selection search contracts from 353 to 274 CSS px while Select all and checkboxes
are revealed; transitions use 180–240 ms and have reduced-motion overrides.
Dropdown search is bounded and scrollable. Focus/keyboard behavior, lifecycle
permissions, concurrent edit recovery and retry identity have focused tests.
Folder input retains inline new-path creation and root placement.

Full frontend adapters gate: 804 tests passed before final placement refinements;
additional selector17 and folder6 focused tests passed. Final typecheck,
architecture1268 and contract regeneration passed. Backend806 full tests passed;
release maintenance additions have a separate final verification record.
Physical Safari and mobile-device testing were not performed. Local private
artifact delivery is covered by backend tests; this browser rejects the local
storage TLS certificate, which was not bypassed.

final result: passed for inspected states

## 2026-09-28 — Grouped sidebar and consistent selection motion

Source visual truth: `../output/falcon-sidebar-system-20260928/reference.png` (1530 × 1602 pixels). The supplied board is a design-system reference, not a screenshot at a specified browser viewport. Its four states define grouping, collapsed icons, tooltips and contextual navigation. Explicit user constraints override its purple tint and outer frame: retain Falcon's current floating shell, neutral palette and font.

Implementation evidence: `../output/falcon-sidebar-system-20260928/`:
- `expanded-dark-1440.png`: 1440 × 900 CSS and image pixels, full navigation, dark, English.
- `expanded-light-1280.png`: 1280 × 720 CSS and image pixels, full navigation, light, English.
- `expanded-light.png`: earlier light Russian capture at 1280 × 720.
- `contextual-dark.png`: contextual Testing group plus pinned Hooks; this mode intentionally omits other Management links from the rail.
- `collapsed-tooltip-dark.png`: same contextual mode, keyboard-focused Dashboard with tooltip; do not compare its item count to full mode.
- `expanded-dark-1024.png`, `expanded-dark-1366.png`: 1024 × 600 and 1366 × 640 compact notebook checks; main navigation scrolls independently of the fixed footer.
- `mobile-dark-680-final.png`: 680 × 800 narrow-window regression check.
- `qa-full-comparison.jpg`: reference and actual dark screenshot combined in one image.
- `qa-focused-comparison.png`: reference expanded rail crop scaled to 240px wide (source crop 335 × 1040, normalized 240 × 745) beside actual 242px rail crop and actual collapsed contextual rail/tooltip. Different overall heights are intentional: existing utility links and shell geometry are preserved. Actual captures use 1 image pixel per CSS pixel.

### Findings and comparison history

Initial implementation review was **blocked** by four issues: Settings/Help disappeared from mobile navigation; the contextual All sections launcher could be disabled without a project; its tooltip target was hidden; group heading heights snapped on collapse. Fixed by retaining mobile utility controls, disabling individual project-dependent routes only, labelling the launcher button itself, and transitioning heading height/padding with the sidebar. A fifth visual issue, mobile footer buttons aligned above the main row, was corrected with centered footer alignment. Final source build includes this correction.

Post-fix comparison: no actionable P0/P1/P2 differences from the requested direction. Independent visual review of both combined comparisons reached the same result. Collapse alone preserves all ten full-mode route IDs; the shorter contextual capture is not lost navigation. No existing screen layout or outer sidebar geometry was redesigned.

Required fidelity surfaces:
- **Fonts/typography:** existing project sans font inherited; 13px rows, 10–11px section headings, 17px Falcon wordmark, no italic/display font. Long labels stay on one line. Russian and English labels inspected.
- **Spacing/layout:** four named groups, 34px compact/38px regular rows, 240px expanded/68px collapsed shell unchanged. Main list gets an independent scroll region at short heights; utilities remain below it. Profile/admin components remain anchored at the bottom when supplied by a signed-in session.
- **Colors/tokens:** existing neutral glass tokens used in both themes; monochrome active state and thin indicator, no new purple treatment. Existing red active-run marker retains its meaning.
- **Assets:** existing Falcon light/dark PNG marks reused, existing Lucide SVG icon family retained. No generated/recreated logo.
- **Copy/content:** only real routes and allowed capabilities; no invented role label, unread count or feature. Contextual mode is explicit, with stable order and per-workspace/per-user pins.

Interaction evidence:
- All sections opens an anchored bounded 300 × 320px panel; mode and pin changes keep it open; Escape/close restore focus. Contextual mode and Hooks pin survived a reload.
- Collapsed tooltip rendered on keyboard focus with accessible description. Delegated pointer enter/leave, Escape, fallback and cleanup covered by component tests. Browser console errors checked: none before dependency restart; local project loaded successfully after private dependency installation and dev-server restart (HTTP 200).
- Expanded and collapsed full mode returned the same ten route IDs.
- Repository folder chevron right edge 276px, icon left edge 280px outside selection: 4px gap, no reserved checkbox track. During selection the track was observed at 16.742px, then 18px; row Y remained 203px.
- Run search stayed at Y145.34px and height37px through selection. Input width contracted from 277.33 to198.65px; heading height stayed47.84px. Nested run folder remained at Y238.19px and height34px, with its grid checkbox track observed at17.586px during transition. Shared tree CSS now owns this behavior across repository, runs and other selectors.
- Reduced-motion CSS disables the new transitions. Capability filtering, scope isolation, corrupted/blocked storage, mode/pin state, popup keyboard behavior and tooltip cleanup have automated coverage.

Verification: architecture1280 files; full adapter chain841 tests passed,0 skipped/failed; TypeScript passed; isolated production build passed,66/66 generated pages, final source hashes matched. Existing unrelated autoprefixer warning in investors-methodology CSS remains. Evidence logs and build result JSON are alongside captures. No production deployment in this task.

Limits: actual account/avatar is absent in this development session, so its placement relies on the retained production component and scoped footer CSS rather than a fabricated profile screenshot. No separate Safari/Windows session was available; responsive checks use browser CSS viewport dimensions, not physical screen inches. Static captures do not quantify frame rate; transition geometry and code paths were checked. Shared dependency directory became empty during the final build pass; this worktree now has its own lockfile-based dependency install, avoiding that shared link.

final result: passed

## Inline defect retest · 30 September 2026

- Source visual: `/var/folders/m4/ss0ghsrd5dl5chxys5v0rgqm0000gn/T/TemporaryItems/NSIRD_screencaptureui_r9JOEH/Screenshot 2026-09-30 at 12.48.31 AM.png` (user attachment, 580×734).
- Implementation: in-app browser tab 42, local demo Payments / PAY-BUG-003. Light and dark browser screenshots are embedded in the task's tool results; no screenshot file was exported.
- Viewport: 1280×720 CSS pixels, screenshot 1280×720. Compared the app-owned detail region, not the surrounding navigation: implementation detail width677px; source cropped detail approximately545px. Intentional content differences: real demo defect and persisted latest-retest metadata.
- Form: located below status/creation metadata and above Overview/Attachments; two columns, 36px fields, 16px outer radius, blue Create run action. Existing Falcon font and neutral theme tokens retained. No new raster assets; existing Lucide icons.
- Focused comparison: caption/field/footer spacing and button alignment checked against the attachment. Removed the old header minimum-height that left excess space before the panel. Final dark screenshot confirms compact spacing and rounded border; form disclosure185px tall, no modal/overlay.
- Interaction: expand/collapse moves tabs/body in normal flow; drafts survive collapse; keyboard focus returns to trigger; reduced-motion uses the shared disclosure behavior. Created PAY-TR-13 with one linked case, build2.4.1(148), Staging. Returned to defect and reloaded: persisted association/name/build/environment restored. Original defect status remains Ready for retest.
- Light and dark render checked; local theme restored to light. Browser console errors: none.1021 adapter tests passed; typecheck and architecture1452 files passed.
- No actionable P0/P1/P2 findings. Narrow-container rules stack fields below380px; physical mobile/Safari testing not performed.
- final result: passed

### Retest panel visual correction — 2026-09-30
User requested a lighter neutral surface and slightly squarer corners. Scoped to the inline retest panel: light #fcfcfc, dark #202020; outer radius 10px (was 16), field radius 7px (was 9). Verified actual computed styles and screenshots in both themes. Existing layout, disclosure motion and run creation are unchanged. CSS-only follow-up; git diff whitespace check passed.

## Inline environment settings — 2026-09-30

- Reference: user screenshot, compact environment list with an editor expanding beneath the row. Retained Falcon's neutral light/dark colors and existing typography; removed card layout and environment modal entry points from settings/header.
- Rows show name, default/archive badge, key, URL/copy and edit/more actions. Three compact inputs and description/actions expand inline. Native View Transitions preserve row identity; measured disclosure fallback supports browsers without that API, with reduced-motion handling.
- Local browser QA: created Motion QA, edited it to Motion QA updated, reopened it and verified persisted fields, then archived the test record. Header returned to the list without an editor from both another settings section and an open editor.
- Screenshots checked in light/dark at 1280×720 and dark at 820×720; captures are inline in tool results. No exported screenshot artifact. Menu stacking corrected so following row actions cannot paint over the menu. No browser console errors in the fresh verification tab. Original light theme and default viewport restored.
- New photorealistic server asset: generated transparent image, optimized to 144×95 WebP (6,222 bytes); header uses 27×18 CSS pixels. No 3D illustration or new branding.
- English and Russian guide instructions updated for inline create/edit and the header-to-list flow.
- Verification: TypeScript and architecture (1,458 files) passed; full adapter test chain passed 1,023 tests; five focused editor/routing tests passed. Editor coverage checks fresh ETag usage, failed-load save guard, draft retention and stable retry operation key.
- Limits: no physical Safari/Windows device validation; production UI requires the user's Auth0 login. Static captures do not measure frame rate.
- final result: passed
