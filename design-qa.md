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
