#!/usr/bin/env bash
set -euo pipefail

mode=${1:---prepare}
[[ "$mode" == "--prepare" || "$mode" == "--publish" ]] || {
  echo "Usage: $0 [--prepare|--publish]" >&2; exit 2;
}
repository=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
config="$repository/infrastructure/cloudflare/codex-lab/wrangler.toml"
wrangler="$repository/node_modules/.bin/wrangler"
source_sha=${FALCON_CODEX_SOURCE_SHA:-}
export_sha=${FALCON_CODEX_EXPORT_SHA:-}
api_origin=${FALCON_CODEX_API_ORIGIN:-}
[[ "$source_sha" =~ ^[0-9a-f]{40}$ && "$export_sha" =~ ^[0-9a-f]{40}$ ]] || {
  echo "Set full reviewed FALCON_CODEX_SOURCE_SHA and FALCON_CODEX_EXPORT_SHA commits." >&2; exit 3;
}
[[ "$(git -C "$repository" rev-parse HEAD)" == "$source_sha" ]] || {
  echo "Worker source commit does not match FALCON_CODEX_SOURCE_SHA." >&2; exit 4;
}
git -C "$repository" cat-file -e "${export_sha}^{commit}"
node - "$api_origin" <<'NODE'
const url = new URL(process.argv[2]);
if (url.protocol !== "https:" || url.username || url.password || url.port || url.pathname !== "/" || url.search || url.hash ||
    !url.hostname.endsWith(".up.railway.app")) throw new Error("Use the isolated Railway HTTPS origin");
NODE
[[ -x "$wrangler" && "$(node -p 'Number(process.versions.node.split(".")[0])')" -ge 22 ]] || {
  echo "Install the reviewed dependencies and use Node 22 or newer." >&2; exit 5;
}
[[ "$(node -p "require('$repository/node_modules/wrangler/package.json').version")" == "4.129.0" ]] || {
  echo "The release requires pinned Wrangler 4.129.0." >&2; exit 6;
}
cd "$repository"
npm run test:tms-worker
node --test infrastructure/cloudflare/codex-lab/artifacts/tests/*.test.mjs
node infrastructure/cloudflare/codex-lab/artifacts/stage.mjs

# The lab deliberately uses the existing OAuth login, without token/key overrides.
run_wrangler() {
  env -u CLOUDFLARE_API_TOKEN -u CF_API_TOKEN -u CLOUDFLARE_API_KEY -u CF_API_KEY "$wrangler" "$@"
}
run_wrangler deploy --config "$config" --var "FALCON_API_ORIGIN:$api_origin" \
  --dry-run --outdir "$repository/dist/codex-lab/worker"
if [[ "$mode" == "--prepare" ]]; then
  printf 'Codex lab prepared locally; no Cloudflare resources changed.\nworker_source_sha=%s\nfrontend_source_sha=%s\n' "$source_sha" "$export_sha"
  exit 0
fi
[[ "${FALCON_CODEX_RELEASE_APPROVED:-}" == "YES" ]] || {
  echo "Publishing requires FALCON_CODEX_RELEASE_APPROVED=YES for the three isolated lab hostnames." >&2; exit 7;
}
[[ -z "$(git status --porcelain)" ]] || {
  echo "The reviewed Worker checkout must be clean before publishing." >&2; exit 8;
}
snapshot=$(mktemp)
trap 'rm -f "$snapshot"' EXIT
inventory="$repository/infrastructure/cloudflare/tms-origin/deployment/verify-domain-bindings.mjs"
run_wrangler auth token --json | node "$inventory" snapshot "$snapshot"
run_wrangler deploy --config "$config" --var "FALCON_API_ORIGIN:$api_origin" \
  --message "Isolated Codex lab ${source_sha}" \
  --outdir "$repository/dist/codex-lab/worker"
run_wrangler auth token --json | node "$inventory" verify "$snapshot"
run_wrangler deployments status --config "$config"
printf 'Codex lab deployed. Existing Falcon domain bindings verified unchanged.\nworker_source_sha=%s\nfrontend_source_sha=%s\n' "$source_sha" "$export_sha"
