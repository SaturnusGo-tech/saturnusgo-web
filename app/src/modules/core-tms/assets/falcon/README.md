# Falcon production assets

The active Carbon / Warm Titanium identity uses surface-aware RGBA assets:

- `falcon-loader-on-dark.png` — detailed loading bird for dark surfaces;
- `falcon-loader-on-light.png` — detailed loading bird for light surfaces;
- `falcon-mark-on-dark.png` — compact master mark on dark chrome;
- `falcon-mark-on-light.png` — compact master mark on light chrome;
- `falcon-favicon-on-dark.png` — 256 px favicon derived from the dark-surface mark;
- `falcon-favicon-on-light.png` — 256 px favicon derived from the light-surface mark.

All six files are square PNGs with real transparent padding. The sidebar is
always graphite, so it uses the `on-dark` master mark. The route favicon
publishes both compact derivatives with `prefers-color-scheme` media queries.

The three approved color explorations are preserved in
`../brand-exploration/falcon/`. Runtime randomization is intentionally not
enabled yet; Carbon / Warm Titanium remains the single production identity.

Falcon is a working product name. Formal trademark, company-name, and domain
clearance is still required before a commercial launch.
