import assert from "node:assert/strict";
import { test } from "node:test";
import type { DesktopDownloadsPanel } from "../presentation/DesktopDownloadsPanel";
import release from "../model/release.json";
import { parseDesktopRelease } from "../model/latest/release";
import { componentHarness, nodes } from "../../portfolios/tests/support/component-harness";
const currentRelease = parseDesktopRelease(release);

test("download panel exposes the verified beta platforms and signing facts without automatic downloads", () => {
  const h = componentHarness(undefined, { document: { body: {} } });
  const { DesktopDownloadsPanel: render } = h.load<{ DesktopDownloadsPanel: typeof DesktopDownloadsPanel }>(new URL("../presentation/DesktopDownloadsPanel.tsx", import.meta.url), name => {
    if (name === "react-dom") return { createPortal: (value: unknown) => value };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("release.json")) return { default: release };
  });
  // Only rendered links may initiate a download; mounting the closed composition has no effects.
  assert.equal(h.render(() => render({ open: false, anchor: { current: null }, onClose() {} })), null);
  h.dispose();
  const noEffects = componentHarness(undefined, { document: { body: {} } });
  const { DesktopDownloadsPanel: openRender } = noEffects.load<{ DesktopDownloadsPanel: typeof DesktopDownloadsPanel }>(new URL("../presentation/DesktopDownloadsPanel.tsx", import.meta.url), name => {
    if (name === "react-dom") return { createPortal: (value: unknown) => value };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("release.json")) return { default: release };
  });
  // Evaluate the JSX before effects; geometry and dismissal are verified separately.
  const all = nodes(openRender({ open: true, anchor: { current: null }, onClose() {}, release: currentRelease }));
  const downloads = all.filter(node => node.type === "a" && typeof node.props.download === "string" && node.props.download !== release.checksums);
  assert.equal(downloads.length, 3);
  assert.deepEqual(downloads.map(node => node.props.href), release.artifacts.map(build => `${release.baseUrl}${build.file}`));
  assert.ok(all.some(node => node.props.children === "macOS: ad-hoc signed, not notarized. Windows: unsigned."));
  assert.ok(all.some(node => node.type === "div" && node.props.role === "dialog" && node.props["aria-modal"] === "false"));
  const guide = all.find(node => node.type === "a" && node.props.href === "https://www.saturnusgo.com/falcon/desktop/install/macos.html");
  assert.ok(guide, "First-launch instructions must be available before opening the downloaded app");
  assert.equal(guide.props.target, "_blank");
  assert.equal(guide.props.rel, "noopener noreferrer");
  assert.equal(guide.props.download, undefined);
});

test("the Mac update chooser offers only Mac installers", () => {
  const h = componentHarness(undefined, { document: { body: {} } });
  const { DesktopDownloadsPanel: render } = h.load<{ DesktopDownloadsPanel: typeof DesktopDownloadsPanel }>(new URL("../presentation/DesktopDownloadsPanel.tsx", import.meta.url), name => {
    if (name === "react-dom") return { createPortal: (value: unknown) => value };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("release.json")) return { default: release };
  });
  const macFiles = release.artifacts.filter(build => build.platform === "mac").map(build => build.file);
  const all = nodes(render({ open: true, anchor: { current: null }, onClose() {}, installerFiles: macFiles, release: currentRelease }));
  const downloads = all.filter(node => node.type === "a" && typeof node.props.download === "string" && node.props.download !== release.checksums);
  assert.deepEqual(downloads.map(node => node.props.download), macFiles);

  const actions: string[] = [];
  const chooser = nodes(render({
    open: true, anchor: { current: null }, installerFiles: macFiles, release: currentRelease,
    onClose() { actions.push("close"); },
    onDownload(href) { actions.push(href); },
  }));
  const installer = chooser.find(node => node.props.href === `${release.baseUrl}${macFiles[0]}`);
  assert.equal(installer?.props.download, undefined);
  const click = installer?.props.onClick as (event: { preventDefault: () => void }) => void;
  click({ preventDefault() { actions.push("prevent-default"); } });
  assert.deepEqual(actions, ["prevent-default", "close", `${release.baseUrl}${macFiles[0]}`]);
});
