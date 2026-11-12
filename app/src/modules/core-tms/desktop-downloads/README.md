# Desktop downloads

The authenticated profile menu owns **Download app**. The public landing links to web sign-in and does not expose another download flow.

`model/release.json` describes the verified release to publish: Apple Silicon, Intel Mac and Windows x64. The macOS applications have ad-hoc signatures and are not notarized; Windows is unsigned. These are beta installers, not a signed production desktop release. Updates require installing the latest desktop build.

Installers are served from `https://saturnusgo.com/falcon/desktop/beta/<version>/`. Installer responses include attachment filenames and one-year immutable caching. `SHA256SUMS.txt` lists all three hashes.

The UI reads the current release from the same-origin `/falcon/desktop/beta/latest.json` endpoint with `cache: no-store`, `credentials: omit` and redirects disabled. The Worker reads its mutable R2 key directly. The bundled manifest supplies a minimum version, never an outdated download fallback. Invalid, unavailable or older metadata does not initiate a download. The update control rechecks latest immediately before handing an installer to the native shell; an unknown-CPU Mac chooser uses the same fetched manifest as its displayed version.

Verify public response headers and stream every downloaded file through SHA-256:

```sh
node scripts/publish-desktop-downloads.mjs --verify
```

To publish a new manifest after validating the desktop artifacts, use the existing Wrangler login and specify its Cloudflare account without placing credentials in source:

```sh
CLOUDFLARE_ACCOUNT_ID=<account-id> node scripts/publish-desktop-downloads.mjs --upload --directory /absolute/path/to/falcon-desktop/dist
```

The script verifies each local artifact against the manifest, uploads only absent keys, and then checks public headers, byte length and streamed SHA-256. An existing installer key is never overwritten; a mismatched object fails verification. A changed installer must use a new release version and prefix.

Only after every installer and checksum passes verification does publishing replace `falcon/desktop/beta/latest.json` with `Cache-Control: no-store`. The script rejects a newer existing pointer before verification and checks again just before replacing it, then reads back the exact published manifest. Serialize publishing jobs: Wrangler does not expose conditional R2 writes, so competing publishers must not run concurrently. `--verify` performs no writes and verifies the latest pointer as well as every immutable artifact. Old builds are retained.
