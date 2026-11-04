# Desktop downloads

The authenticated profile menu owns **Download app**. The public landing links to web sign-in and does not expose another download flow.

`model/release.json` is the immutable release manifest shared by the UI and `scripts/publish-desktop-downloads.mjs`. The current three installers are **Beta 0.2.2**: Apple Silicon, Intel Mac and Windows x64. The macOS applications have ad-hoc signatures and are not notarized; Windows is unsigned. These are beta installers, not a signed production desktop release. Updates require installing the next desktop build.

Objects are served directly from the R2 custom domain under `https://saturnusgo.com/falcon/desktop/beta/0.2.2/`. Installer responses include attachment filenames and one-year immutable caching. `SHA256SUMS.txt` lists all three hashes.

Verify public response headers and stream every downloaded file through SHA-256:

```sh
node scripts/publish-desktop-downloads.mjs --verify
```

To publish a new manifest after validating the desktop artifacts, use the existing Wrangler login and specify its Cloudflare account without placing credentials in source:

```sh
CLOUDFLARE_ACCOUNT_ID=<account-id> node scripts/publish-desktop-downloads.mjs --upload --directory /absolute/path/to/falcon-desktop/dist
```

The script verifies each local artifact against the manifest, uploads only absent keys, and then checks public headers, byte length and streamed SHA-256. An existing key is never overwritten; a mismatched object fails verification. A changed installer must use a new release version and prefix.
