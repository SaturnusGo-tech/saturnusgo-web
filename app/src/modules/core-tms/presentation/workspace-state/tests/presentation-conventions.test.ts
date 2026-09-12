import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";

const root = process.cwd();
const source = (path: string) => readFileSync(resolve(root, path), "utf8");

test("Falcon is the active user-facing TMS brand", () => {
  const shellSource = source(
    "app/src/modules/core-tms/presentation/workspace/tms-shell.module.css",
  );
  const activeSources = [
    source("app/(routes)/testcases/umbrella-home/work/page.tsx"),
    source("app/(routes)/testcases/umbrella-home/work/TmsFavicon.tsx"),
    source("app/src/modules/core-tms/presentation/navigation/Navigation.tsx"),
    shellSource,
    source("app/src/modules/core-tms/tms.module.css"),
    source("app/src/modules/core-tms/localization/catalog/shell/en.ts"),
    source("app/src/modules/core-tms/localization/catalog/shell/ru.ts"),
  ].join("\n");

  assert.match(activeSources, /FALCON/);
  assert.match(activeSources, /Falcon test management workspace/);
  assert.match(activeSources, /siteName: "Falcon"/);
  assert.match(activeSources, /https:\/\/tms\.saturnusgo\.com\/testcases\/umbrella-home\/work\//);
  assert.match(activeSources, /assets\/falcon\/falcon-mark-on-dark\.png/);
  assert.match(activeSources, /assets\/falcon\/falcon-favicon-on-dark\.png/);
  assert.match(activeSources, /assets\/falcon\/falcon-favicon-on-light\.png/);
  assert.match(activeSources, /assets\/falcon\/falcon-loader-on-dark\.png/);
  assert.match(activeSources, /assets\/falcon\/falcon-loader-on-light\.png/);
  assert.match(activeSources, /prefers-color-scheme: light/);
  assert.match(activeSources, /prefers-color-scheme: dark/);
  assert.match(shellSource, /\.header\s*\{[\s\S]*?background: var\(--paper\)/);
  assert.match(shellSource, /\.navigation\s*\{[\s\S]*?--sidebar-text: #e7e9ec;[\s\S]*?background: #0d0d0f/);
  assert.match(shellSource, /\.tessiqMark\s*\{[\s\S]*?falcon-mark-on-dark\.png/);
  const darkNavigation = shellSource.match(/:global\(\.dark\) \.navigation\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(darkNavigation, /--sidebar-text: var\(--tms-text\)/);
  assert.match(darkNavigation, /background: var\(--tms-bg-sidebar\)/);
  assert.match(shellSource, /background: #0d0d0f/);
  assert.doesNotMatch(activeSources, /workspaceLoaderPulse/);
  assert.doesNotMatch(activeSources, /TESSIQ|assets\/tessiq\//);
  assert.doesNotMatch(activeSources, /assets\/falcon\/falcon-mark\.png/);
});

test("Falcon production assets are square RGBA PNGs with transparency", () => {
  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  const assets = [
    ["falcon-loader-on-dark.png", 512],
    ["falcon-loader-on-light.png", 512],
    ["falcon-mark-on-dark.png", 512],
    ["falcon-mark-on-light.png", 512],
    ["falcon-favicon-on-dark.png", 256],
    ["falcon-favicon-on-light.png", 256],
  ];

  assets.forEach(([name, minimumSize]) => {
    const asset = readFileSync(
      resolve(root, `app/src/modules/core-tms/assets/falcon/${name}`),
    );
    assert.deepEqual([...asset.subarray(0, 8)], pngSignature);
    assert.equal(asset.toString("ascii", 12, 16), "IHDR");
    assert.equal(asset.readUInt32BE(16), asset.readUInt32BE(20));
    assert.ok(asset.readUInt32BE(16) >= Number(minimumSize));
    assert.equal(asset[25], 6);
  });
});

test("suite settings and detail reuse the repository and the shared Markdown editor", () => {
  const dialog = source("app/src/modules/core-tms/presentation/dialogs/suite/SuiteDialog.tsx");
  const fields = source("app/src/modules/core-tms/presentation/dialogs/suite/fields/SuiteEditableFields.tsx");
  const detail = source("app/src/modules/core-tms/presentation/suites/detail/repository/SuiteRepository.tsx");
  for (const screen of [dialog, detail]) { assert.match(screen, /<SelectionTree/); assert.match(screen, /<SelectionControls/); assert.doesNotMatch(screen, /<EmbeddedCaseList/); }
  assert.match(fields, /<MarkdownField/); assert.match(fields, /onRequestEdit/); assert.doesNotMatch(fields, /<Pencil/);
});

test("suite primary actions keep white labels and visible keyboard focus", () => {
  const styles = source("app/src/modules/core-tms/presentation/dialogs/suite/suite-dialog.module.css");
  const suites = source("app/src/modules/core-tms/presentation/suites/suites.module.css");
  assert.match(suites, /\.primary\.primary[\s\S]*color: #fff !important/);
  assert.match(suites, /\.search input\s*\{[^}]*background: transparent; outline: none; box-shadow: none/s);
  assert.match(suites, /button:focus-visible[^}]*outline: 2px solid #3574f0/);
  assert.doesNotMatch(styles, /focus[^}]*border-color: var\(--action\)/s);
});
