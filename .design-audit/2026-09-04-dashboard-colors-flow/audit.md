# Falcon dashboard audit — color, Run Flow, and risk signals

## Audit scope

Production dashboard for Umbrella-Host at 1280×720 in Russian, covering the dark and light themes, the Run Flow chart, and the “Где проседаем” table.

## User goal and accessibility target

Make operational states immediately distinguishable without decorative noise, keep the pass-rate signal readable with sparse run data, and prevent pass-rate and coverage indicators from looking like one duplicated control. Preserve meaningful labels, keyboard actions, and non-color text values.

## Step 1 — dark theme

Evidence: `01-dashboard-dark-before.png`.

Health before fix: needs work. The overall structure is compact and the two primary operational blocks are visible together, but chart colors are desaturated against the charcoal canvas. The sparse pass-rate line collapses into a tall blue spike at the right edge. In the Local Protection row, adjacent pass-rate and coverage bars visually merge into a duplicated progress indicator.

Accessibility risk: labels and percentages remain present, but similar low-luminance hues make series identification harder for low-vision users. Screenshot evidence cannot verify keyboard focus order or screen-reader announcements.

## Step 2 — light theme

Evidence: `02-dashboard-light-before.png`.

Health before fix: poor contrast hierarchy. The chart series and metric accents look washed out on white, while the percentage spike becomes the strongest object despite being secondary to run outcomes. The two-bar risk-row pattern is even easier to misread as one broken control.

Accessibility risk: the chart legend uses text plus swatches, which is a strength, but several swatches are too close in perceived brightness. Screenshot evidence cannot establish WCAG contrast ratios for antialiased chart marks.

## Highest-impact corrections

1. Remove pass rate from the sparse time-series line and present it as a dedicated, period-aware KPI next to the date selector.
2. Keep Run Flow focused on launched runs and outcome counts with distinct semantic colors.
3. Replace the pass-rate progress bar in each risk row with a compact semantic score; retain only one bar for coverage.
4. Increase dashboard-local color saturation and contrast independently for light and dark themes while preserving Falcon’s restrained neutral surfaces.
5. Keep text values and accessible labels so meaning is not encoded by color alone.

## Evidence limits

This audit covers the rendered 1280×720 dashboard and visible semantics. Responsive reflow, keyboard interaction, motion reduction, and final post-fix behavior require implementation testing.
