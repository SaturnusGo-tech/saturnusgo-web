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
manifest_file="$source_repo/infrastructure/cloudflare/tms-origin/route-manifest.mjs"
origin_namespace="tms-origin"
falcon_asset_path="falcon"
expected_pages_remote_https="https://github.com/SaturnusGo-tech/saturnusgo-web.github.io.git"
expected_pages_remote_ssh="git@github.com:SaturnusGo-tech/saturnusgo-web.github.io.git"

if [[ -z "$expected_sha" ]]; then
  echo "TMS_SOURCE_SHA is required; deployment must be bound to a reviewed source commit." >&2
  exit 3
fi
[[ -d "$pages_repo/.git" ]] || { echo "Pages repository not found: $pages_repo" >&2; exit 4; }
[[ -f "$manifest_file" ]] || { echo "TMS route manifest not found: $manifest_file" >&2; exit 4; }

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
pages_branch=$(git -C "$pages_repo" symbolic-ref --quiet --short HEAD 2>/dev/null || true)
[[ "$pages_branch" == "main" ]] || {
  echo "Pages checkout must be on main, found: ${pages_branch:-detached HEAD}" >&2
  exit 8
}
pages_remote=$(git -C "$pages_repo" config --get remote.origin.url 2>/dev/null || true)
[[ "$pages_remote" == "$expected_pages_remote_https" || "$pages_remote" == "$expected_pages_remote_ssh" ]] || {
  echo "Pages origin must be SaturnusGo-tech/saturnusgo-web.github.io on GitHub; found: ${pages_remote:-missing}" >&2
  exit 9
}
if ! remote_main_row=$(git -C "$pages_repo" ls-remote --exit-code origin refs/heads/main 2>/dev/null); then
  echo "Unable to resolve origin/main for the Pages repository." >&2
  exit 10
fi
remote_main_sha=$(printf '%s\n' "$remote_main_row" | awk 'NR == 1 { print $1 }')
pages_sha=$(git -C "$pages_repo" rev-parse HEAD)
[[ -n "$remote_main_sha" && "$pages_sha" == "$remote_main_sha" ]] || {
  echo "Pages main is not exactly synchronized with origin/main: local $pages_sha, remote ${remote_main_sha:-missing}" >&2
  exit 11
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
  npm run clean
  BUILD_TARGET=export \
  NEXT_PUBLIC_AUTH0_DOMAIN=dev-4v1srvqwzp1m7cdl.us.auth0.com \
  NEXT_PUBLIC_AUTH0_CLIENT_ID=CQjoUKhO0f73Cb80jmWNiGXuyZt1TviC \
  NEXT_PUBLIC_AUTH0_AUDIENCE=https://api.tms.saturnusgo.com \
  NEXT_PUBLIC_TMS_API_BASE=https://api.tms.saturnusgo.com/api/v1 \
  npm run build
)
restore_api
trap - EXIT

out_dir="$source_repo/out"
test -f "$out_dir/$route_path/index.html"
if find "$out_dir/testcases" -type d | grep -Eq 'UmbrellaHome|/Work$'; then
  echo "Mixed-case TMS route was emitted." >&2
  exit 12
fi
if rg -n 'http://(?:localhost|127\.0\.0\.1)|/testcases/UmbrellaHome/Work' "$out_dir"; then
  echo "Local API or mixed-case route leaked into the export." >&2
  exit 13
fi

manifest_rows() {
  node --input-type=module - "$manifest_file" <<'NODE'
import { pathToFileURL } from "node:url";

const manifest = await import(pathToFileURL(process.argv[2]).href);
const routes = manifest.publicRoutes;
if (manifest.ORIGIN_NAMESPACE !== "/tms-origin") {
  throw new Error("The route manifest must use the isolated /tms-origin namespace.");
}
if (manifest.APP_PATH !== "/testcases/umbrella-home/work/") {
  throw new Error("The route manifest must preserve the stable TMS/Auth0 callback route.");
}
if (!Array.isArray(routes) || routes.length === 0) {
  throw new Error("The route manifest must declare public routes.");
}
const publicPaths = new Set();
const artifactPaths = new Set();
for (const route of routes) {
  if (typeof route.publicPath !== "string" || !route.publicPath.startsWith("/") ||
      (route.publicPath !== "/" && !route.publicPath.endsWith("/"))) {
    throw new Error(`Non-canonical public route: ${route.publicPath}`);
  }
  if (typeof route.artifactPath !== "string" || route.artifactPath.startsWith("/") ||
      !route.artifactPath.endsWith("index.html") || route.artifactPath.includes("..")) {
    throw new Error(`Unsafe route artifact: ${route.artifactPath}`);
  }
  if (typeof route.required !== "boolean") {
    throw new Error(`Route requirement must be boolean: ${route.publicPath}`);
  }
  if (publicPaths.has(route.publicPath) || artifactPaths.has(route.artifactPath)) {
    throw new Error(`Duplicate route mapping: ${route.publicPath}`);
  }
  publicPaths.add(route.publicPath);
  artifactPaths.add(route.artifactPath);
}
const root = routes.find((route) => route.publicPath === "/");
if (!root || root.artifactPath !== "index.html" || !root.required) {
  throw new Error("The required public root must map to index.html.");
}
for (const requiredPath of ["/signup/", "/cloud-login/"]) {
  if (!routes.some((route) => route.publicPath === requiredPath && route.required)) {
    throw new Error(`Missing required Falcon route: ${requiredPath}`);
  }
}
for (const prefix of manifest.publicAssetPrefixes ?? []) {
  if (!prefix.startsWith("/") || !prefix.endsWith("/") || prefix.includes("..")) {
    throw new Error(`Unsafe public asset prefix: ${prefix}`);
  }
}
if (!manifest.publicAssetPrefixes.includes("/falcon/")) {
  throw new Error("The route manifest must expose the isolated /falcon/ asset prefix.");
}
if (!Array.isArray(manifest.requiredPublicAssets) || manifest.requiredPublicAssets.length === 0) {
  throw new Error("The route manifest must declare required public assets.");
}
const requiredAssets = new Set();
for (const asset of manifest.requiredPublicAssets) {
  if (typeof asset !== "string" || !asset.startsWith("/") || asset.endsWith("/") ||
      asset.includes("..") || asset.includes("%") || asset.includes("\\") ||
      asset.includes("?") || asset.includes("#") ||
      !manifest.publicAssetPrefixes.some((prefix) => asset.startsWith(prefix))) {
    throw new Error(`Unsafe required public asset: ${asset}`);
  }
  if (requiredAssets.has(asset)) throw new Error(`Duplicate required public asset: ${asset}`);
  requiredAssets.add(asset);
}
process.stdout.write(routes.map((route) => [
  route.publicPath,
  route.artifactPath,
  route.required ? "required" : "optional",
].join("\t")).join("\n"));
NODE
}

required_asset_rows() {
  node --input-type=module - "$manifest_file" <<'NODE'
import { pathToFileURL } from "node:url";

const manifest = await import(pathToFileURL(process.argv[2]).href);
process.stdout.write(manifest.requiredPublicAssets.join("\n"));
NODE
}

origin_stage=$(mktemp -d)
cleanup_origin_stage() {
  rm -rf "$origin_stage"
}
trap cleanup_origin_stage EXIT

manifest_output=$(manifest_rows)
while IFS=$'\t' read -r public_path artifact_path requirement; do
  [[ -n "$artifact_path" ]] || continue
  source_artifact="$out_dir/$artifact_path"
  if [[ ! -f "$source_artifact" ]]; then
    if [[ "$requirement" == "required" ]]; then
      echo "Required Falcon route is missing from the export: $public_path ($artifact_path)" >&2
      exit 14
    fi
    continue
  fi
  destination_dir="$origin_stage/$(dirname "$artifact_path")"
  mkdir -p "$destination_dir"
  rsync -a "$source_artifact" "$destination_dir/"
  source_route_data="${source_artifact%.html}.txt"
  if [[ -f "$source_route_data" ]]; then rsync -a "$source_route_data" "$destination_dir/"; fi
done <<< "$manifest_output"

printf '{"sourceSha":"%s","routeManifest":"tms-origin-v1"}\n' "$actual_sha" \
  > "$origin_stage/release.json"

[[ -d "$out_dir/$falcon_asset_path" ]] || {
  echo "Required Falcon landing assets are missing: $falcon_asset_path" >&2
  exit 15
}
while IFS= read -r required_asset; do
  [[ -n "$required_asset" ]] || continue
  [[ -f "$out_dir$required_asset" ]] || {
    echo "Required public asset is missing from the export: $required_asset" >&2
    exit 15
  }
done <<< "$(required_asset_rows)"

echo "Scoped Pages changes:"
rsync -ani "$out_dir/_next/" "$pages_repo/_next/"
rsync -ani --delete "$out_dir/$route_path/" "$pages_repo/$route_path/"
rsync -ani --delete "$origin_stage/" "$pages_repo/$origin_namespace/"
rsync -ani --delete "$out_dir/$falcon_asset_path/" "$pages_repo/$falcon_asset_path/"

if [[ "$mode" == "--prepare" ]]; then
  echo "Prepared only; Pages checkout was not modified."
  exit 0
fi
[[ "${TMS_RELEASE_APPROVED:-}" == "YES" ]] || {
  echo "Publishing requires TMS_RELEASE_APPROVED=YES after backend/Auth0 readiness confirmation." >&2
  exit 16
}

mkdir -p \
  "$pages_repo/_next" \
  "$pages_repo/$route_path" \
  "$pages_repo/$origin_namespace" \
  "$pages_repo/$falcon_asset_path"
rsync -a "$out_dir/_next/" "$pages_repo/_next/"
rsync -a --delete "$out_dir/$route_path/" "$pages_repo/$route_path/"
rsync -a --delete "$origin_stage/" "$pages_repo/$origin_namespace/"
rsync -a --delete "$out_dir/$falcon_asset_path/" "$pages_repo/$falcon_asset_path/"
touch "$pages_repo/.nojekyll"
git -C "$pages_repo" add \
  _next \
  "$route_path" \
  "$origin_namespace" \
  "$falcon_asset_path" \
  .nojekyll
git -C "$pages_repo" commit -m "deploy: TMS ${actual_sha:0:8}"
git -C "$pages_repo" push origin main
