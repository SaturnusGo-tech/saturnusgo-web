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
  assert.match(shellSource, /\.navigation\s*\{[\s\S]*?--sidebar-text: #e7e9ec;[\s\S]*?background: linear-gradient\(160deg, #252a36 0%, #282936 34%, #292731 68%, #25232c 100%\)/);
  assert.match(shellSource, /\.tessiqMark\s*\{[\s\S]*?falcon-mark-on-dark\.png/);
  assert.match(shellSource, /:global\(\.dark\) \.navigation\s*\{[\s\S]*?background: linear-gradient/);
  assert.match(shellSource, /background: linear-gradient\(160deg, #252a36 0%, #282936 34%, #292731 68%, #25232c 100%\)/);
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

test("suite configuration follows the editable test-case document hierarchy", () => {
  const dialog = source("app/src/modules/core-tms/presentation/dialogs/suite/SuiteDialog.tsx");
  const styles = source("app/src/modules/core-tms/presentation/dialogs/suite/suite-dialog.module.css");
  assert.match(dialog, /type EditableSection = "name" \| "description" \| "mode" \| null/);
  assert.match(dialog, /className=\{dialog\.hero\}/);
  assert.match(dialog, /<EditButton section="name"/);
  assert.match(dialog, /<EditButton section="description"/);
  assert.match(dialog, /<EditButton section="mode"/);
  assert.match(dialog, /<EmbeddedCaseList/);
  assert.match(styles, /\.titleLine h1\s*\{[^}]*font-size: clamp\(25px, 3vw, 34px\)/s);
  assert.match(styles, /\.editorialSection\s*\{[^}]*border-bottom:/s);
});

test("suite primary actions keep white labels and neutral focus treatment", () => {
  const styles = source("app/src/modules/core-tms/presentation/dialogs/suite/suite-dialog.module.css");
  const suites = source("app/src/modules/core-tms/presentation/suites/suites.module.css");
  assert.match(suites, /\.createButton\.createButton[\s\S]*color: #fff !important/);
  assert.match(suites, /\.workspace :is\(button, input\):focus-visible\s*\{[^}]*outline: 0 !important/s);
  assert.doesNotMatch(styles, /focus[^}]*border-color: var\(--action\)/s);
});
