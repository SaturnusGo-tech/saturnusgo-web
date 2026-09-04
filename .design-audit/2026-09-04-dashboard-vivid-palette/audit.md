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
