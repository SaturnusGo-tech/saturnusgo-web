import assert from "node:assert/strict";
import { test } from "node:test";
import type { useDesktopDownloadsAvailable } from "../../presentation/useDesktopDownloadsAvailable";
import type { isFalconDesktop } from "../../../auth/sign-in/domain/desktop-mode";
import { componentHarness } from "../../../portfolios/tests/support/component-harness";

for (const [name, userAgent, available] of [
  ["web", "Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36", true],
  ["desktop", "Mozilla/5.0 Electron/33.0.0 FalconDesktop/0.2.2", false],
] as const) {
  test(`${name} download availability stays hidden until the client environment is known`, () => {
    const h = componentHarness(undefined, { navigator: { userAgent } });
    const desktopMode = h.load<{ isFalconDesktop: typeof isFalconDesktop }>(new URL("../../../auth/sign-in/domain/desktop-mode.ts", import.meta.url));
    const { useDesktopDownloadsAvailable: useAvailable } = h.load<{ useDesktopDownloadsAvailable: typeof useDesktopDownloadsAvailable }>(new URL("../../presentation/useDesktopDownloadsAvailable.ts", import.meta.url), name => {
      if (name.endsWith("desktop-mode")) return desktopMode;
    });
    assert.equal(h.render(useAvailable), false);
    assert.equal(h.render(useAvailable), available);
    h.dispose();
  });
}
