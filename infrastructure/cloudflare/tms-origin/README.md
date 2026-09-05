# Falcon TMS public origin

The Worker exposes a deliberately small surface on `https://tms.saturnusgo.com` while using the
existing `www.saturnusgo.com` Pages repository as its static origin.

## Route contract

- `/` serves the Falcon landing artifact from `/tms-origin/index.html` at the origin.
- `/signup/` serves individual tenant registration.
- `/cloud-login/` serves returning cloud-user login.
- `/login/` is optional and is published only when `out/login/index.html` exists.
- `/testcases/umbrella-home/work/` remains the stable Auth0 callback and TMS deep-link route.
- `/_next/` is shared and `/falcon/` contains Falcon-only public assets.
- legacy `/mock/` and `/cdn-cgi/` paths are not exposed; percent-encoded or non-canonical paths are
  rejected before an origin request is made.
- all other application paths return `404`; the hidden `/tms-origin/` namespace is never exposed.

The source of truth is `route-manifest.mjs`. Public HTML is copied into the isolated
`tms-origin/` Pages directory because the Pages repository root belongs to
`www.saturnusgo.com` and must not be replaced by a TMS release.

## Release order

1. Use Node 22 or newer and install the reviewed lockfile with `npm ci`. Wrangler is pinned exactly;
   do not substitute a global install or `npx`-resolved version.
2. Run `npm run test:tms-worker`.
3. Run `TMS_SOURCE_SHA=<full-reviewed-sha> npm run prepare:pages` and inspect the scoped diff.
4. Publish Pages with
   `TMS_SOURCE_SHA=<full-reviewed-sha> TMS_RELEASE_APPROVED=YES npm run deploy:pages`.
5. Wait for GitHub Pages to serve the new `/tms-origin/release.json`, required route HTML, Falcon
   assets, and referenced Next.js runtime assets over HTTPS.
6. Run `TMS_SOURCE_SHA=<full-reviewed-sha> npm run prepare:tms-worker`. This repeats Worker tests,
   proves Pages serves the exact reviewed SHA, and performs a Wrangler dry-run.
7. Deploy only with `CLOUDFLARE_API_TOKEN` set and
   `TMS_SOURCE_SHA=<full-reviewed-sha> TMS_WORKER_RELEASE_APPROVED=YES npm run deploy:tms-worker`.
   Preserve the printed source SHA, Wrangler version, deployment status, and evidence hashes in the
   release record.
8. Smoke-test `/`, `/signup/`, `/cloud-login/`, an Auth0 callback on the TMS route, encoded traversal
   attempts that must return `404`, and an unapproved path that must return `404`.

`scripts/deploy_pages.sh` fails closed when a required route or Falcon asset directory is absent.
It never writes `index.html` at the Pages repository root. It also refuses to build or publish
unless the Pages checkout is clean, on `main`, points at the reviewed
`SaturnusGo-tech/saturnusgo-web.github.io` GitHub repository, and its HEAD exactly matches the live
`origin/main` ref. The staged `/tms-origin/release.json` binds the public artifact to the reviewed
source commit and is checked before any Worker deployment.

## Production origin and authentication requirements

- Backend `CORS_ORIGINS` must contain the exact origin `https://tms.saturnusgo.com`. Admin API
  access continues to use Auth0 bearer tokens. Falcon Cloud accounts use the backend's host-only
  `__Host-` session cookie on `api.tms.saturnusgo.com`, so credentialed CORS is enabled only for
  the exact allowlisted origin. Never set `Domain=.saturnusgo.com` on that cookie.
- Auth0 Allowed Callback URLs must contain
  `https://tms.saturnusgo.com/testcases/umbrella-home/work/`.
- Auth0 Allowed Web Origins and Allowed Origins (CORS) must contain
  `https://tms.saturnusgo.com`.
- Auth0 Allowed Logout URLs must contain `https://tms.saturnusgo.com/` before logout returns to the
  Falcon landing.
- R2 CORS already contains `https://tms.saturnusgo.com`; retain it for direct signed uploads.

The Worker never forwards browser cookies, authorization headers, or Cloudflare client-IP headers
to the Pages origin. OAuth callback parameters are also removed from the origin fetch while they
remain in the browser URL for the Auth0 client. The Worker strips any origin `Set-Cookie` response
and rejects redirects that cannot be mapped back to an approved TMS route. HTTP requests to the
canonical host are upgraded to the identical HTTPS URL with `308`. Missing origin objects,
non-success responses, and MIME mismatches become a local plain-text `404`, so legacy Pages HTML
cannot appear under the TMS origin. The Worker also replaces origin browser policy headers with the
reviewed Falcon policy: anti-framing CSP, HSTS, MIME sniffing protection, a strict referrer policy,
and a minimal permissions policy. Keep the Auth0, backend, Swagger, and private R2 origins in that
CSP synchronized with production configuration.
