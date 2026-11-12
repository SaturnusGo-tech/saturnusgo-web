import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes } from "../../../core-tms/portfolios/tests/support/component-harness";
import { installedDesktopVersion } from "../../../core-tms/desktop-downloads/model/update";
import type { DocumentationOpenAppAction } from "../DocumentationOpenAppAction";

for (const [name, userAgent, shown] of [
  ["macOS browser", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/150.0.0.0", true],
  ["Windows browser", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/150.0.0.0", true],
  ["Falcon macOS", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Electron/43 FalconDesktop/0.2.10", false],
  ["Falcon beta", "Mozilla/5.0 Electron/43 FalconDesktop/0.2.10-beta.1", false],
  ["Falcon Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Electron/43 FalconDesktop/0.2.10", false],
] as const) {
  test(`Help ${shown ? "offers" : "hides"} Open App in ${name}`, () => {
    const h = componentHarness(undefined, { navigator: { userAgent } });
    try {
      const { DocumentationOpenAppAction: render } = h.load<{ DocumentationOpenAppAction: typeof DocumentationOpenAppAction }>(
        new URL("../DocumentationOpenAppAction.tsx", import.meta.url), name => {
          if (name.endsWith("/update")) return { installedDesktopVersion };
        });
      const view = () => render({ href: "/work/?view=cases", label: "Open app" });
      assert.equal(nodes(h.render(view)).length, 0, "Unknown environment never flashes a redundant action");
      const links = nodes(h.render(view)).filter(node => node.type === "a");
      assert.equal(links.length, shown ? 1 : 0);
      if (shown) assert.equal(links[0].props.href, "/work/?view=cases");
    } finally { h.dispose(); }
  });
}

test("the action has a deterministic server render without browser globals", () => {
  const h = componentHarness();
  try {
    const { DocumentationOpenAppAction: render } = h.load<{ DocumentationOpenAppAction: typeof DocumentationOpenAppAction }>(
      new URL("../DocumentationOpenAppAction.tsx", import.meta.url), name => {
        if (name.endsWith("/update")) return { installedDesktopVersion };
      });
    assert.equal(nodes(h.render(() => render({ href: "/cloud-login/?lang=en", label: "Open app" }))).length, 0);
  } finally { h.dispose(); }
});
