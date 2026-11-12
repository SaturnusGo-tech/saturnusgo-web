import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes } from "../../../portfolios/tests/support/component-harness";
import release from "../../model/release.json";
import type { AvailableDesktopUpdate } from "../../model/update";
import { parseDesktopRelease } from "../../model/latest/release";

test("a failed click-time latest check never opens a stale installer and can retry safely", async t => {
  const current = parseDesktopRelease(release), file = current.artifacts[2].file;
  const available: AvailableDesktopUpdate = { version: current.version, release: current, installer: { file, href: current.baseUrl + file } };
  let checks = 0, failed = true; const opened: string[] = [];
  const h = componentHarness(undefined, { navigator: { userAgent: "Windows NT FalconDesktop/0.2.9" }, setTimeout: () => 1, clearTimeout() {} });
  t.after(h.dispose);
  Object.assign(h.window, { open: (href: string) => opened.push(href) });
  const { DesktopUpdateControl: View } = h.load<{ DesktopUpdateControl: () => unknown }>(
    new URL("../../presentation/update/DesktopUpdateControl.tsx", import.meta.url), name =>
      name.endsWith("useTmsLocale") ? { useTmsLocale: () => ({ locale: "en" }) }
        : name.endsWith("/update") ? { loadDesktopUpdate: async () => {
          if (checks++ > 0 && failed) throw new Error("Latest metadata unavailable"); return available;
        } } : undefined);
  const render = () => nodes(h.render(View));
  const click = () => (render().find(node => node.props["data-testid"] === "desktop-update")!.props.onClick as (event: unknown) => void)({ preventDefault() {} });
  render(); await new Promise(setImmediate); click(); click(); await new Promise(setImmediate);
  assert.equal(checks, 2); assert.deepEqual(opened, []);
  assert.equal(render().find(node => node.props["data-testid"] === "desktop-update")!.props["aria-busy"], undefined);
  assert.equal(render().find(node => node.props.role === "alert")?.props.children, "Could not open the download. Try again.");
  failed = false; click(); await new Promise(setImmediate);
  assert.deepEqual(opened, [available.installer!.href]);
});

test("an unknown-CPU Mac chooser uses the fetched release and files together rather than the bundled version", async t => {
  const current = parseDesktopRelease({ ...release, version: "0.2.12", baseUrl: "https://saturnusgo.com/falcon/desktop/beta/0.2.12/",
    artifacts: release.artifacts.map(build => ({ ...build, file: build.file.replace(release.version, "0.2.12") })) });
  const macFiles = current.artifacts.filter(build => build.platform === "mac").map(build => build.file);
  const h = componentHarness(undefined, { navigator: { userAgent: "Macintosh FalconDesktop/0.2.9" } }); t.after(h.dispose);
  const { DesktopUpdateControl: View } = h.load<{ DesktopUpdateControl: () => unknown }>(
    new URL("../../presentation/update/DesktopUpdateControl.tsx", import.meta.url), name =>
      name.endsWith("useTmsLocale") ? { useTmsLocale: () => ({ locale: "en" }) }
        : name.endsWith("/update") ? { loadDesktopUpdate: async () => ({ version: current.version, installer: null, macFiles, release: current }) } : undefined);
  const render = () => nodes(h.render(View)); render(); await new Promise(setImmediate);
  const chooser = render().find(node => node.type === "DesktopDownloadsPanel")!;
  assert.equal((chooser.props.release as typeof current).version, "0.2.12"); assert.deepEqual(chooser.props.installerFiles, macFiles);
});
