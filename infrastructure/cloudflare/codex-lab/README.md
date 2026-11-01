# Isolated Falcon Codex lab

This deployment creates a separate `falcon-codex-lab` Worker and serves the already reviewed
Falcon export through Worker Static Assets. It uses the same Worker and company gateway source as
production. No GitHub Pages checkout, production Worker configuration, production domain, database,
or R2 binding is part of this release.

The only configured domains are `codex-lab-falcon.saturnusgo.com` (tenant),
`codex-lab-admin.saturnusgo.com` (platform) and `codex-lab-foreign-falcon.saturnusgo.com`
(a second tenant for isolation checks). Workers.dev and preview URLs are disabled. Every
request passes through the existing host, document, API and response-policy checks before assets
can be served. Missing local assets never fall back to the production static origin.

## Artifact contract

`artifacts/stage.mjs` copies `admin`, `profile`, `sandbox`, `privacy`, the TMS work route, their
Next route data, the Next runtime, the favicon and all Falcon assets except marketing landing media.
The managed root redirects to the work route or sandbox through the existing gateway. The lab does
not publish the public landing, cloud login, signup, marketing routes or documentation audio bucket.
Documentation screenshots and other UI assets remain available. Each asset must be a regular file
of at most 25 MiB. The deterministic manifest in `dist/codex-lab/asset-manifest.json` records the
reviewed frontend source SHA, every asset hash and the aggregate artifact hash.

The shared Worker optionally accepts `FALCON_STATIC_ASSETS`. The production configuration does not
bind it and keeps using its current static origin. The lab binds it with `run_worker_first=true`,
`html_handling=none` and `not_found_handling=none`; this preserves the existing explicit route map
and prevents static hosting from bypassing document authentication or returning an SPA fallback.

## Prepare and publish

Use the installed Node 22+ runtime and pinned Wrangler 4.129.0. Set:

```bash
export FALCON_CODEX_SOURCE_SHA=<reviewed-full-worker-commit>
export FALCON_CODEX_EXPORT_SHA=ca1bef2d2ca9a832809812dea79df7c05554a93b
export FALCON_CODEX_API_ORIGIN=https://<isolated-service>.up.railway.app
bash scripts/deploy_codex_lab.sh --prepare
```

Preparation runs the focused Worker and artifact checks, stages the existing export, and performs
a local Wrangler dry-run. It does not build Next or change Cloudflare resources. Inspect the
manifest and bundled Worker before publishing. The API origin must point at the separate lab
backend; the committed placeholder is deliberately nonresolving.

Publishing requires a clean reviewed commit and `FALCON_CODEX_RELEASE_APPROVED=YES`, then
`bash scripts/deploy_codex_lab.sh --publish`. The script uses the existing Wrangler OAuth login,
publishes only this config and verifies that the preexisting production Falcon domain bindings
are unchanged. The supplied API variable is a public origin, never a credential.

Before exposing a usable lab, install a newly generated lab-only 64-lowercase-hex
`FALCON_MANAGED_GATEWAY_KEY` secret on `falcon-codex-lab` through Wrangler's stdin flow, and configure
the same value only on the isolated backend. Until it is present the shared gateway fails closed.
Never reuse or read the production gateway key. The backend also needs the matching lab platform
hostname, company-domain suffix, three CORS origins, fresh database and fresh root binding. Provision
the `codex-lab` and `codex-lab-foreign` tenants through the platform after the isolated backend is ready.

Smoke-check the tenant and platform managed entrypoints, profile/admin routes, OAuth metadata and
Codex consent/resume flow. Check that an unknown path, direct `/tms-origin/` access and a missing
asset return 404. The production Worker and Pages release remain separate.

Cloudflare reference: [Static Assets configuration and bindings](https://developers.cloudflare.com/workers/static-assets/binding/).
