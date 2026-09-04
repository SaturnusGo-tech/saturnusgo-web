# Falcon dashboard audit — vivid operational palette

## Scope

Production dashboard for Umbrella-Host at 1280×720 in Russian, covering the light and dark themes and the categorical/semantic color system.

## Step 1 — dark theme before correction

Evidence: `01-dark-before.png`.

Health: needs work. The neutral charcoal canvas is appropriate, but the chart marks and status accents are low-chroma, dusty versions of blue, green, purple, amber, and red. At dashboard scale the small swatches lose energy and become visually similar.

Accessibility risk: labels prevent color-only interpretation, but low separation between the small categorical marks increases scanning effort.

## Step 2 — light theme before correction

Evidence: `02-light-before.png`.

Health: needs work. White surfaces amplify the gray cast of the accents. The former sand and olive tokens read brown/khaki rather than as clear operational categories, while muted coral and slate make several series feel disabled.

Accessibility risk: the information remains available in text, but the visual hierarchy does not let users locate success, warning, failure, and category series quickly.

## Correction direction

1. Replace earth-tone token families with clean cobalt, emerald, violet, orange, cyan, rose, and one saturated cool secondary.
2. Keep semantic meaning stable: emerald for success, rose/red for failure, orange for warning, cobalt for launched/in-progress.
3. Use the remaining accents only for categorical distinction, preserving a restrained neutral canvas instead of coloring cards or backgrounds.
4. Increase tint and border strength for small KPI/status surfaces so the new chroma survives at compact dashboard sizes.

## Evidence limits

The initial audit is scoped to the connected desktop dashboard. Keyboard behavior is unchanged by this color-only correction; screenshots cannot establish complete color-vision accessibility.

## Step 3 — light theme after correction

Evidence: `03-light-after.png` and `04-light-after-lower.png`.

Health: healthy. The operational series now use clean cobalt, emerald, violet, orange, cyan, and rose on neutral white surfaces. Success, failure, warning, launched, incomplete, and categorical series are immediately distinguishable without coloring entire cards.

The lower dashboard confirms that the former olive, sand, muted coral, and gray-blue marks no longer survive in type, tag, or product-coverage charts.

## Step 4 — dark theme after correction

Evidence: `05-dark-after.png` and `06-dark-after-lower.png`.

Health: healthy. The dark theme uses lighter high-chroma counterparts rather than reusing dim light-theme values. Small chart marks remain legible on charcoal while neutral cards and typography keep the page from becoming a rainbow.

## Final verification

- Same-state light comparison: `07-light-comparison.png` (1280×720 before and after).
- Cross-theme lower-dashboard comparison: `08-theme-comparison-lower.png` (1087×814 light and dark).
- Production console: zero errors and zero warnings after switching themes and scrolling through the dashboard.
- Residual limitation: dark-theme after capture uses the user's later 1087×814 browser size, so it is assessed as a theme/responsiveness check rather than a pixel-for-pixel comparison against the 1280×720 dark before capture.

Final health: healthy in production.
