#!/usr/bin/env bash
set -euo pipefail

mode="${1:---prepare}"
if [[ "$mode" != "--prepare" && "$mode" != "--publish" ]]; then
  echo "Usage: TMS_SOURCE_SHA=<sha> $0 [--prepare|--publish]" >&2
  exit 2
fi

script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source_repo=$(cd "$script_dir/.." && pwd)
pages_repo=${TMS_PAGES_REPO:-"$(dirname "$source_repo")/saturnusgo-web.github.io"}
expected_sha=${TMS_SOURCE_SHA:-}
route_path="testcases/umbrella-home/work"

if [[ -z "$expected_sha" ]]; then
  echo "TMS_SOURCE_SHA is required; deployment must be bound to a reviewed source commit." >&2
  exit 3
fi
[[ -d "$pages_repo/.git" ]] || { echo "Pages repository not found: $pages_repo" >&2; exit 4; }

actual_sha=$(git -C "$source_repo" rev-parse HEAD)
[[ "$actual_sha" == "$expected_sha" ]] || {
  echo "Source SHA mismatch: expected $expected_sha, found $actual_sha" >&2
  exit 5
}
[[ -z "$(git -C "$source_repo" status --porcelain)" ]] || {
  echo "Source checkout must be clean before release." >&2
  exit 6
}
[[ -z "$(git -C "$pages_repo" status --porcelain)" ]] || {
  echo "Pages checkout must be clean before release." >&2
  exit 7
}

api_hold_dir=$(mktemp -d)
restore_api() {
  if [[ -d "$api_hold_dir/api" ]]; then mv "$api_hold_dir/api" "$source_repo/app/api"; fi
  rmdir "$api_hold_dir" 2>/dev/null || true
}
trap restore_api EXIT
if [[ -d "$source_repo/app/api" ]]; then mv "$source_repo/app/api" "$api_hold_dir/api"; fi

(
  cd "$source_repo"
  BUILD_TARGET=export \
  NEXT_PUBLIC_AUTH0_DOMAIN=dev-4v1srvqwzp1m7cdl.us.auth0.com \
  NEXT_PUBLIC_AUTH0_CLIENT_ID=CQjoUKhO0f73Cb80jmWNiGXuyZt1TviC \
  NEXT_PUBLIC_AUTH0_AUDIENCE=https://api.tms.saturnusgo.com \
  NEXT_PUBLIC_TMS_API_BASE=https://umbrella-home-tms-backend-production.up.railway.app/api/v1 \
  npm run build
)
restore_api
trap - EXIT

out_dir="$source_repo/out"
test -f "$out_dir/$route_path/index.html"
if find "$out_dir/testcases" -type d | grep -Eq 'UmbrellaHome|/Work$'; then
  echo "Mixed-case TMS route was emitted." >&2
  exit 8
fi
if rg -n 'http://(?:localhost|127\.0\.0\.1)|/testcases/UmbrellaHome/Work' "$out_dir"; then
  echo "Local API or mixed-case route leaked into the export." >&2
  exit 9
fi

echo "Scoped Pages changes:"
rsync -ani "$out_dir/_next/" "$pages_repo/_next/"
rsync -ani --delete "$out_dir/$route_path/" "$pages_repo/$route_path/"

if [[ "$mode" == "--prepare" ]]; then
  echo "Prepared only; Pages checkout was not modified."
  exit 0
fi
[[ "${TMS_RELEASE_APPROVED:-}" == "YES" ]] || {
  echo "Publishing requires TMS_RELEASE_APPROVED=YES after backend/Auth0 readiness confirmation." >&2
  exit 10
}

mkdir -p "$pages_repo/_next" "$pages_repo/$route_path"
rsync -a "$out_dir/_next/" "$pages_repo/_next/"
rsync -a --delete "$out_dir/$route_path/" "$pages_repo/$route_path/"
touch "$pages_repo/.nojekyll"
git -C "$pages_repo" add _next "$route_path" .nojekyll
git -C "$pages_repo" commit -m "deploy: TMS ${actual_sha:0:8}"
git -C "$pages_repo" push origin main
