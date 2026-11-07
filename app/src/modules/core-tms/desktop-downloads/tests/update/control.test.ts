import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes } from "../../../portfolios/tests/support/component-harness";
import { getDesktopUpdate } from "../../model/update";
import release from "../../model/release.json";

function setup(userAgent: string, locale = "en") {
  const h = componentHarness(undefined, { navigator: { userAgent } });
  const { DesktopUpdateControl } = h.load<{ DesktopUpdateControl: () => unknown }>(
    new URL("../../presentation/update/DesktopUpdateControl.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale }) };
      if (name.endsWith("/update")) return { getDesktopUpdate };
    });
  return { render: () => nodes(h.render(DesktopUpdateControl)), dispose: h.dispose };
}

test("an outdated Windows build offers a direct, versioned installer after hydration", async () => {
  const h = setup("Mozilla/5.0 (Windows NT 10.0; Win64; x64) FalconDesktop/0.1.0");
  assert.deepEqual(h.render(), []);
  await new Promise(setImmediate);
  const action = h.render().find(node => node.props["data-testid"] === "desktop-update");
  assert.equal(action?.type, "a");
  assert.equal(action?.props.href, `${release.baseUrl}Falcon-${release.version}-win-x64-beta-setup.exe`);
  assert.equal(action?.props["aria-label"], `Download Falcon ${release.version} update`);
  h.dispose();
});

test("the control stays absent in web and on current desktop builds", async () => {
  for (const userAgent of [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150.0.0.0",
    `Mozilla/5.0 (Windows NT 10.0; Win64; x64) FalconDesktop/${release.version}`,
  ]) {
    const h = setup(userAgent);
    assert.deepEqual(h.render(), []);
    await new Promise(setImmediate);
    assert.deepEqual(h.render(), []);
    h.dispose();
  }
});

test("the Russian update control opens the Mac-only chooser when the CPU is unknown", async () => {
  const h = setup("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) FalconDesktop/0.1.0", "ru");
  h.render();
  await new Promise(setImmediate);
  const action = h.render().find(node => node.props["data-testid"] === "desktop-update");
  assert.equal(action?.type, "button");
  assert.equal(action.props["aria-label"], `Скачать обновление Falcon ${release.version}`);
  (action.props.onClick as () => void)();
  const panel = h.render().find(node => node.type === "DesktopDownloadsPanel");
  assert.deepEqual(panel?.props.installerFiles, release.artifacts.filter(build => build.platform === "mac").map(build => build.file));
  assert.equal(panel?.props.open, true);
  h.dispose();
});
