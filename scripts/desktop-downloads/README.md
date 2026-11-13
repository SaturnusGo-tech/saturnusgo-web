# Falcon installer retention

Only `cdn-saturnusgo/falcon/desktop/beta/` is inventoried. Deletion accepts only the three strict full-installer filenames and `SHA256SUMS.txt` beneath a valid release version. It never accepts `latest.json`, other pointers, provenance, delta archives, unknown files, or another bucket namespace. No bucket lifecycle rule is installed.

The current complete release and the newest prior verified complete rollback remain protected. Other recognized complete sets receive immutable retirement metadata, then retain their installers for **seven full days from the actual retirement write**. Failed managed uploads retain their known files for **48 hours from upload intent or the newest object write, whichever is later**. A missing verified rollback prevents retirement and deletion. Unknown legacy files are quarantined and reported; missing provenance never silently authorizes deletion.

## Managed writer requirement

Every publishing and cleanup command must run on one managed host, under the same OS account. Both take the atomic host-wide `~/.falcon-desktop-release/writer.lock`, shared across worktrees, and never steal or expire it. CLI writes require `--managed-host` to match that host's hostname. Restrict all installer writers operationally to this host/account. Multiple hosts need an external exclusive writer queue before rollout: the Cloudflare REST API does not supply the documented atomic conditional operations needed for a distributed lock or conditional delete.

An uncoordinated dashboard/API writer is outside this serialization boundary. Apply also revalidates the complete snapshot and current pointer before mutation and checks installer identities and pointer before each delete, stopping on drift. It cannot eliminate the check/delete race against an unauthorized writer. For a stale lock after a crash, inspect `owner.json` and establish that its process and all publishing/cleanup jobs are stopped before manually removing the lock directory.

Use Node 22 and the existing Wrangler OAuth login, or an existing `CLOUDFLARE_API_TOKEN`. Tokens stay in memory and are never placed in the plan or log. Set `CLOUDFLARE_ACCOUNT_ID` to the owning account. Expired OAuth fails closed; refresh it with Wrangler first.

## Inventory and exact plan review

Default execution is read-only. Output includes exact delete keys and identities, immediate bytes, retirement candidates and bytes, protected versions, provenance adoption, and quarantined versions:

```sh
node scripts/desktop-downloads/cli/retention.mjs --plan /absolute/path/installer-plan.json
```

The first rollout explicitly adopts recognized legacy sets:

```sh
node scripts/desktop-downloads/cli/retention.mjs --adopt-legacy --plan /absolute/path/installer-initialization.json
```

Adoption requires exactly the three expected installer paths plus a strict three-entry SHA256SUMS file. Current metadata must match the authoritative latest manifest. Only the selected rollback's three bodies are streamed through SHA-256; older retirement candidates receive `inventory-only` provenance, which cannot qualify them as a verified rollback. The initial reviewed apply writes small provenance and retirement markers; it deletes zero installers because the seven-day clock starts on apply. Unknown or incomplete legacy sets require separate evidence and remain untouched.

Review the JSON and the SHA-256 printed to stderr. Apply the exact file and digest within one hour, before publishing or inventory changes:

```sh
node scripts/desktop-downloads/cli/retention.mjs \
  --apply /absolute/path/installer-initialization.json \
  --sha256 <printed-plan-sha256> \
  --managed-host "$(hostname)"
```

Apply derives actions again from current authoritative data and rejects a changed pointer, object identity, expired or modified plan. A retirement uses actual apply time, never the plan creation time. Any metadata failure stops before deletions. After a partial delete failure, generate and review a new plan; only unchanged surviving retired objects remain eligible. Provenance/retirement manifests are always preserved.

## Successful publish housekeeping

The publisher records upload intent before artifact writes. Only after all local/public byte and SHA-256 checks, pointer advance, and exact readback succeed does it save verified provenance and run the same retirement/deletion policy under the shared lock. Failed or partial uploads never run cleanup. A cleanup error is reported with `published: true` and leaves the successful release intact; retry with a fresh reviewed retention plan. Retired versions cannot be republished. If legacy initialization has not established a verified rollback, housekeeping retains all installers and reports the missing protection.

Focused verification:

```sh
npm run test:desktop-downloads
```

No frontend build, backend test suite, native build, deployment, bucket configuration change, or live installer deletion is required to validate this tooling.
