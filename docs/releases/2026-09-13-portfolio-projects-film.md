# Portfolio/project landing film

The first landing chapter now shows creating a portfolio, creating a project within it, and adding two cases. It then demonstrates browsing the whole portfolio, selecting two of its projects, and opening a single project. The old overview stays excluded. The following six published films are unchanged: case creation, run/team, suite, defect/retest, dashboard, YouTrack.

The new production recording is 60.3 seconds, 1728×1118, H.264; the final MP4 is 2,628,653 bytes, SHA256 `42709827674f66d91d965e60182600ac47829a6aa9f1e824f6ca4b68d6df18dc`. It preserves the real collapsed sidebar and profile. Captions and poster ship alongside the film. Two additional demo projects were prepared between the recorded takes.

Portfolio repository also gains a multiple-project filter. It composes with case search and the existing facets, keeps selection when a case opens, and can reset to the full portfolio. An empty result now gives the existing filter guidance.

Validation: TypeScript and architecture checks passed; 13 repository tests, 50 auth/public-page tests and 53 worker/deployment tests passed. The recorded production interaction confirmed 4 cases across 3 projects → 3 cases across 2 projects → 2 cases in one project. Full video decoding and visual inspection of cuts, form, saved results, filter and final frame passed. Production asset and browser checks are recorded after publishing in `output/falcon-films-20260912/release/projects/`.
