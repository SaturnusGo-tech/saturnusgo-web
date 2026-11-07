import assert from "node:assert/strict";
import { test } from "node:test";
import type { useDesktopDownloadsAvailable } from "../../presentation/useDesktopDownloadsAvailable";
import { installedDesktopVersion } from "../../model/update";
import { componentHarness } from "../../../portfolios/tests/support/component-harness";

for (const [name, userAgent, maxTouchPoints, available] of [
  ["Windows web with a touchscreen", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36", 10, true],
  ["macOS Safari", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/18.0 Safari/605.1.15", 0, true],
  ["Linux Chrome", "Mozilla/5.0 (X11; Linux x86_64) Chrome/130.0.0.0 Safari/537.36", 0, true],
  ["Falcon Desktop", "Mozilla/5.0 Electron/33.0.0 FalconDesktop/0.2.2", 0, false],
  ["Falcon Desktop prerelease", "Mozilla/5.0 Electron/45.2.2 FalconDesktop/0.2.8-beta.1", 0, false],
  ["iPhone Safari", "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1", 5, false],
  ["Android Chrome", "Mozilla/5.0 (Linux; Android 15) Chrome/130.0.0.0 Mobile Safari/537.36", 5, false],
  ["Android tablet Chrome", "Mozilla/5.0 (Linux; Android 15) Chrome/130.0.0.0 Safari/537.36", 5, false],
  ["iPad Safari in desktop mode", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/18.0 Safari/605.1.15", 5, false],
] as const) {
  test(`${name} ${available ? "offers" : "hides"} desktop downloads after hydration`, () => {
    const h = componentHarness(undefined, { navigator: { userAgent, maxTouchPoints } });
    const { useDesktopDownloadsAvailable: useAvailable } = h.load<{ useDesktopDownloadsAvailable: typeof useDesktopDownloadsAvailable }>(new URL("../../presentation/useDesktopDownloadsAvailable.ts", import.meta.url), name => {
      if (name.endsWith("/update")) return { installedDesktopVersion };
    });
    assert.equal(h.render(useAvailable), false);
    assert.equal(h.render(useAvailable), available);
    h.dispose();
  });
}
