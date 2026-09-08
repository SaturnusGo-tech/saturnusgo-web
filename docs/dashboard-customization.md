# Project dashboard customization

The dashboard uses existing dashboard and widget records. No database migration is needed. GET /dashboards supports projectOnly=true, bound to the project scope and pagination cursor. Existing callers retain their original behavior.

A project starts empty. The current dashboard is its active default, or first active project dashboard if none is marked default. Layout is shared by the project team. The first iteration exposes one current layout per project. Changes remain an editing draft until Save. ETag protects concurrent updates; an interrupted save retries the same idempotent command. Widget settings.presentation identifies a catalog presentation without duplicating metric calculation. Server analytics and workbench projections remain authoritative.

The 36 catalog entries can be added, removed, resized and reordered. A pencil opens editing; drag handles and remove/size controls are absent in viewing mode. Pointer and keyboard dragging, reduced motion, Russian/English and responsive layouts are supported.

## Artwork provenance

The three flat technical covers were generated with the built-in image_gen tool, then encoded as 768px WebP assets with cwebp for delivery. Original generated PNGs remain in the Codex generated_images directory. The library illustration also serves the empty state. No 3D art is shipped.

### cover-activity.webp

Use case: productivity-visual. Asset type: premium developer-tool extension marketplace cover art, 1536x1024 landscape, flat 2D only. Extremely precise technical editorial graphic with sophisticated graphic design, like a carefully drawn systems diagram from a high-end developer magazine. Off-black #141416 background, subtle neutral hairlines, restrained electric-blue highlights, crisp negative space, optical balance. No 3D, no glass, no bevels, no shadows, no floating windows, no dashboard mockup, no gradients, no stock sci-fi imagery, no robots, no text, no letters, no numbers, no watermark. The art must still read clearly as a small cover at 200px wide. Three or four strong shapes and controlled fine detail, designed rather than random. Subject: a precise horizontal event timeline that splits into four parallel thin lanes. A handful of small circular checkpoints, one solid cobalt event marker, a sparse dashed continuation. Organized left to right, a visual metaphor for test execution.

### cover-analytics.webp

Use case: productivity-visual. Asset type: premium developer-tool extension marketplace cover art, 1536x1024 landscape, flat 2D only. Extremely precise technical editorial graphic with sophisticated graphic design, like a carefully drawn systems diagram from a high-end developer magazine. Off-black #141416 background, subtle neutral hairlines, restrained electric-blue highlights, crisp negative space, optical balance. No 3D, no glass, no bevels, no shadows, no floating windows, no dashboard mockup, no gradients, no stock sci-fi imagery, no robots, no text, no letters, no numbers, no watermark. The art must still read clearly as a small cover at 200px wide. Three or four strong shapes and controlled fine detail, designed rather than random. Subject: two meticulously drawn branching signal traces crossing a sparse coordinate grid. One cobalt trace rises through five square control points, one thin silver baseline. Architectural two-dimensional plotting, not a generic stock chart. Deliberate spacing and one oversized open circle focus point.

### cover-library.webp

Use case: productivity-visual. Asset type: premium developer-tool extension marketplace cover art, 1536x1024 landscape, flat 2D only. Extremely precise technical editorial graphic with sophisticated graphic design, like a carefully drawn systems diagram from a high-end developer magazine. Off-black #141416 background, subtle neutral hairlines, restrained electric-blue highlights, crisp negative space, optical balance. No 3D, no glass, no bevels, no shadows, no floating windows, no dashboard mockup, no gradients, no stock sci-fi imagery, no robots, no text, no letters, no numbers, no watermark. The art must still read clearly as a small cover at 200px wide. Three or four strong shapes and controlled fine detail, designed rather than random. Subject: a flat index of modular technical diagrams arranged on a sparse drafting grid: four outlined square modules, one with an elegant dot matrix, one with three fine aligned lines, and one selected module marked by small cobalt corner brackets. The connected modules fit together like a logical system. No overlapping cards, no depth.

