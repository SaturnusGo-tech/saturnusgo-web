#!/usr/bin/env bash
set -euo pipefail

mode="${1:---prepare}"
if [[ "$mode" != "--prepare" && "$mode" != "--publish" ]]; then
  echo "Usage: TMS_SOURCE_SHA=<reviewed-sha> $0 [--prepare|--publish]" >&2
  exit 2
fi

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source_repo=$(cd "$script_dir/.." && pwd)
worker_dir="$source_repo/infrastructure/cloudflare/tms-origin"
wrangler_config="$worker_dir/wrangler.toml"
readiness_script="$worker_dir/verify-pages-origin-readiness.mjs"
wrangler_bin="$source_repo/node_modules/.bin/wrangler"
expected_wrangler_version="4.129.0"
expected_sha=${TMS_SOURCE_SHA:-}

[[ "$expected_sha" =~ ^[0-9a-f]{40}$ ]] || {
  echo "TMS_SOURCE_SHA must be the full lowercase 40-character reviewed source commit." >&2
  exit 3
}
[[ -f "$wrangler_config" && -f "$readiness_script" ]] || {
  echo "Worker release configuration is incomplete." >&2
  exit 4
}
actual_sha=$(git -C "$source_repo" rev-parse HEAD)
[[ "$actual_sha" == "$expected_sha" ]] || {
  echo "Source SHA mismatch: expected $expected_sha, found $actual_sha" >&2
  exit 5
}
[[ -z "$(git -C "$source_repo" status --porcelain)" ]] || {
  echo "Source checkout must be clean before Worker release." >&2
  exit 6
}
grep -Eq '"wrangler"[[:space:]]*:[[:space:]]*"4\.129\.0"' "$source_repo/package.json" || {
  echo "package.json must pin Wrangler exactly to $expected_wrangler_version." >&2
  exit 7
}
[[ -x "$wrangler_bin" ]] || {
  echo "Pinned Wrangler is not installed; run npm ci before release." >&2
  exit 8
}
node_version=$(node --version)
node_major=${node_version#v}
node_major=${node_major%%.*}
[[ "$node_major" =~ ^[0-9]+$ && "$node_major" -ge 22 ]] || {
  echo "Wrangler $expected_wrangler_version requires Node 22 or newer; found ${node_version:-unknown}." >&2
  exit 9
}
installed_wrangler_version=$(
  "$wrangler_bin" --version | awk 'match($0, /[0-9]+\.[0-9]+\.[0-9]+/) { print substr($0, RSTART, RLENGTH); exit }'
)
[[ "$installed_wrangler_version" == "$expected_wrangler_version" ]] || {
  echo "Installed Wrangler version mismatch: expected $expected_wrangler_version, found ${installed_wrangler_version:-unknown}." >&2
  exit 10
}

(
  cd "$source_repo"
  npm run test:tms-worker
)

node "$readiness_script" --source-sha "$expected_sha"

if [[ "$mode" == "--prepare" ]]; then
  (
    cd "$worker_dir"
    "$wrangler_bin" deploy --config wrangler.toml --dry-run
  )
  printf 'Worker release prepared (no deployment):\n  source_sha=%s\n  wrangler=%s\n' \
    "$actual_sha" "$installed_wrangler_version"
  exit 0
fi

[[ "${TMS_WORKER_RELEASE_APPROVED:-}" == "YES" ]] || {
  echo "Worker publishing requires TMS_WORKER_RELEASE_APPROVED=YES after Pages readiness review." >&2
  exit 11
}
[[ -n "${CLOUDFLARE_API_TOKEN:-}" ]] || {
  echo "CLOUDFLARE_API_TOKEN is required for Worker publishing." >&2
  exit 12
}

deployment_output=$(mktemp)
deployment_status=$(mktemp)
cleanup_evidence() {
  rm -f "$deployment_output" "$deployment_status"
}
trap cleanup_evidence EXIT

(
  cd "$worker_dir"
  "$wrangler_bin" deploy \
    --config wrangler.toml \
    --message "Falcon TMS ${actual_sha}"
) 2>&1 | tee "$deployment_output"
(
  cd "$worker_dir"
  "$wrangler_bin" deployments status --config wrangler.toml
) 2>&1 | tee "$deployment_status"

printf '\nWorker production release evidence:\n'
printf '  source_sha=%s\n' "$actual_sha"
printf '  wrangler=%s\n' "$installed_wrangler_version"
printf '  config=%s\n' "$wrangler_config"
printf '  deploy_output_sha256=%s\n' "$(shasum -a 256 "$deployment_output" | awk '{ print $1 }')"
printf '  status_output_sha256=%s\n' "$(shasum -a 256 "$deployment_status" | awk '{ print $1 }')"
cat "$deployment_status"
