# Project dashboard customization

Project members with report read access can save a private dashboard for each project. Before the first personal save, Falcon shows the project's team dashboard with any existing private position overrides. Starting personal customization uses that view as the initial layout. Adding, removing, resizing and reordering widgets changes the user's own dashboard. A user can also start from an empty project.

The team dashboard remains available through **Edit team dashboard** for members with report management permissions. Its layout still uses the shared dashboard and widget records. Personal dashboards use the separate owner-scoped records introduced by migration 0124. Both paths retain drafts until Save, use ETags to protect concurrent changes and replay an interrupted save with the same idempotency key. Server analytics and workbench projections supply the metrics in both paths.

Both paths use the same widget library and renderer. The library preserves the project context and global navigation. Returning to the dashboard preserves the editing draft. Pointer and keyboard dragging, reduced motion, Russian and English, and responsive layouts are supported.

Numeric widgets always use the compact width, including legacy saved metrics configured at full width; editing normalizes their persisted positions and cancel leaves the stored layout untouched. Only visual and list widgets expose width controls. Numeric widgets use compact label/value rows with full values in their accessible labels and tooltips. The CSS grid reserves measured row spans from intrinsic content height, so a counter is not stretched to a neighboring chart. ResizeObserver recomputes spans for changes in width, content and editing controls; DOM ordering and the existing persisted layout remain authoritative. Tags and coverage use a single interactive bar/list representation, and defect statuses adapt to the widget container width.

## Artwork provenance

The three flat technical covers were generated with the built-in image_gen tool, then encoded as 768px WebP assets with cwebp for delivery. Original generated PNGs remain in the Codex generated_images directory. The empty state uses empty-library.webp, a transparent-alpha extraction of cover-library.webp made with the built-in image_gen tool; it has no container background. The original cover assets remain for compatibility; catalog entries use semantic icons. No 3D art is shipped.

### cover-activity.webp

Use case: productivity-visual. Asset type: premium developer-tool extension marketplace cover art, 1536x1024 landscape, flat 2D only. Extremely precise technical editorial graphic with sophisticated graphic design, like a carefully drawn systems diagram from a high-end developer magazine. Off-black #141416 background, subtle neutral hairlines, restrained electric-blue highlights, crisp negative space, optical balance. No 3D, no glass, no bevels, no shadows, no floating windows, no dashboard mockup, no gradients, no stock sci-fi imagery, no robots, no text, no letters, no numbers, no watermark. The art must still read clearly as a small cover at 200px wide. Three or four strong shapes and controlled fine detail, designed rather than random. Subject: a precise horizontal event timeline that splits into four parallel thin lanes. A handful of small circular checkpoints, one solid cobalt event marker, a sparse dashed continuation. Organized left to right, a visual metaphor for test execution.

### cover-analytics.webp

Use case: productivity-visual. Asset type: premium developer-tool extension marketplace cover art, 1536x1024 landscape, flat 2D only. Extremely precise technical editorial graphic with sophisticated graphic design, like a carefully drawn systems diagram from a high-end developer magazine. Off-black #141416 background, subtle neutral hairlines, restrained electric-blue highlights, crisp negative space, optical balance. No 3D, no glass, no bevels, no shadows, no floating windows, no dashboard mockup, no gradients, no stock sci-fi imagery, no robots, no text, no letters, no numbers, no watermark. The art must still read clearly as a small cover at 200px wide. Three or four strong shapes and controlled fine detail, designed rather than random. Subject: two meticulously drawn branching signal traces crossing a sparse coordinate grid. One cobalt trace rises through five square control points, one thin silver baseline. Architectural two-dimensional plotting, not a generic stock chart. Deliberate spacing and one oversized open circle focus point.

### cover-library.webp

Use case: productivity-visual. Asset type: premium developer-tool extension marketplace cover art, 1536x1024 landscape, flat 2D only. Extremely precise technical editorial graphic with sophisticated graphic design, like a carefully drawn systems diagram from a high-end developer magazine. Off-black #141416 background, subtle neutral hairlines, restrained electric-blue highlights, crisp negative space, optical balance. No 3D, no glass, no bevels, no shadows, no floating windows, no dashboard mockup, no gradients, no stock sci-fi imagery, no robots, no text, no letters, no numbers, no watermark. The art must still read clearly as a small cover at 200px wide. Three or four strong shapes and controlled fine detail, designed rather than random. Subject: a flat index of modular technical diagrams arranged on a sparse drafting grid: four outlined square modules, one with an elegant dot matrix, one with three fine aligned lines, and one selected module marked by small cobalt corner brackets. The connected modules fit together like a logical system. No overlapping cards, no depth.

### empty-library.webp

Background extraction of the existing modular line illustration. Real alpha, transparent module interiors, no construction-grid backdrop. Encoded as lossless 768 × 512 WebP; source PNG is exec-45352d13-f252-4dae-af72-1c5dcd0c4afe.png in the Codex generated_images directory.

## Metric detail pages

All 29 catalog presentations share the same detail surface: compact record lists for runs and defects, the existing folder tree for cases, and run-grouped execution checks. The detail header retains a text link to Dashboard and the project/period context; the global header continues to own backward/forward navigation.

Filters expand inline above the records. Product group, product and regression refine the server query while preserving the metric’s entity, time basis and predicates. Case product scopes retain selection and run preparation. Project/type/status/priority selectors support multiple values; active list filters remain visible as removable chips when the filter area is collapsed. Search, local list filters and sorting apply to loaded records, with a notice whenever another page exists. Loading more retains existing rows.

Record layouts use bounded title/product/status columns and responsive secondary metadata. Full values remain available through tooltips and opening the record. The same token palette, focus behavior and status/progress signals apply in Light and Dark themes. Keyboard Escape closes a selector before its parent filter area; leaving a facet selector with Tab dismisses its menu.
