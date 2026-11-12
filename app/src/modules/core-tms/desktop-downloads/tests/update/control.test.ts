import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes } from "../../../portfolios/tests/support/component-harness";
import { getDesktopUpdate, type AvailableDesktopUpdate } from "../../model/update";
import type { DesktopRelease } from "../../model/latest/release";
import release from "../../model/release.json";

function setup(userAgent: string, locale = "en", check?: () => Promise<AvailableDesktopUpdate | null>) {
  const timers = new Set<() => void>();
  const h = componentHarness(undefined, {
    navigator: { userAgent },
    setTimeout: (callback: () => void) => { timers.add(callback); return callback; },
    clearTimeout: (callback: () => void) => { timers.delete(callback); },
  });
  const { DesktopUpdateControl } = h.load<{ DesktopUpdateControl: () => unknown }>(
    new URL("../../presentation/update/DesktopUpdateControl.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale }) };
      if (name.endsWith("/update")) {
        const loadDesktopUpdate = check ?? (async () => {
          const update = await getDesktopUpdate({ userAgent }, release);
          return update ? { ...update, release: release as DesktopRelease } : null;
        });
        return { getDesktopUpdate: loadDesktopUpdate, loadDesktopUpdate };
      }
    });
  const opened: string[] = [];
  const window = h.window as typeof h.window & { open: (href: string, target: string, options: string) => null };
  const handoffListeners = new Set<(event: { detail: { requestId: string; opened: boolean } }) => void>();
  window.addEventListener = (name: string, callback: () => void) => {
    if (name === "falcon:desktop-update-handoff") handoffListeners.add(callback);
  };
  window.removeEventListener = (name: string, callback: () => void) => {
    if (name === "falcon:desktop-update-handoff") handoffListeners.delete(callback);
  };
  window.open = (href, target, options) => {
    assert.equal(target, "_blank");
    assert.equal(options, "noopener,noreferrer");
    opened.push(href);
    return null;
  };
  return {
    render: () => nodes(h.render(DesktopUpdateControl)), dispose: h.dispose, window, opened,
    acknowledge: (detail: { requestId: string; opened: boolean }) => handoffListeners.forEach(listener => listener({ detail })),
    finishHandoff: () => { for (const timer of [...timers]) { timers.delete(timer); timer(); } },
  };
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

test("clicking an existing update rechecks latest and skips an intermediate installer", async () => {
  let checks = 0;
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FalconDesktop/0.2.9";
  const next = { ...release, version: "0.2.12", baseUrl: "https://saturnusgo.com/falcon/desktop/beta/0.2.12/",
    artifacts: release.artifacts.map(artifact => ({ ...artifact, file: artifact.file.replace(release.version, "0.2.12") })) } as DesktopRelease;
  const h = setup(userAgent, "en", async () => {
    const current = checks++ ? next : release as DesktopRelease;
    const update = await getDesktopUpdate({ userAgent }, current);
    return update ? { ...update, release: current } : null;
  });
  h.render(); await new Promise(setImmediate);
  const action = h.render().find(node => node.props["data-testid"] === "desktop-update")!;
  (action.props.onClick as (event: unknown) => void)({ preventDefault() {} });
  await new Promise(setImmediate);
  assert.equal(checks, 2);
  assert.deepEqual(h.opened, [`${next.baseUrl}Falcon-0.2.12-win-x64-beta-setup.exe`]); h.dispose();
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

test("opening a desktop installer displays the loading orb and blocks duplicate browser handoffs", async () => {
  const h = setup("Mozilla/5.0 (Windows NT 10.0; Win64; x64) FalconDesktop/0.1.0");
  const render = () => h.render().find(node => node.props["data-testid"] === "desktop-update")!;
  render();
  await new Promise(setImmediate);
  const action = render();
  let prevented = 0;
  const click = action.props.onClick as (event: { preventDefault: () => void }) => void;
  const event = { preventDefault: () => { prevented++; } };
  click(event);
  click(event);
  assert.equal(prevented, 2);
  await new Promise(setImmediate);
  assert.deepEqual(h.opened.map(href => href.split("#")[0]), [action.props.href]);
  assert.equal(render().props["aria-label"], "Opening download");
  assert.equal(render().props["aria-busy"], true);
  assert.ok(h.render().some(node => node.type === "LoadingOrb"));
  h.finishHandoff();
  assert.equal(render().props["aria-busy"], undefined);
  assert.equal(render().props["aria-label"], action.props["aria-label"]);
  assert.equal(h.render().some(node => node.type === "LoadingOrb"), false);
  h.dispose();
});

test("a browser launch error is announced and the Russian control can retry", async () => {
  const h = setup("Mozilla/5.0 (Windows NT 10.0; Win64; x64) FalconDesktop/0.1.0", "ru");
  const render = () => h.render().find(node => node.props["data-testid"] === "desktop-update")!;
  render();
  await new Promise(setImmediate);
  const open = h.window.open;
  h.window.open = () => { throw new Error("Browser unavailable"); };
  const event = { preventDefault() {} };
  (render().props.onClick as (event: unknown) => void)(event);
  await new Promise(setImmediate);
  assert.equal(render().props["aria-busy"], undefined);
  assert.match(String(h.render().find(node => node.props.role === "alert")?.props.children), /Не удалось открыть загрузку/);
  h.window.open = open;
  (render().props.onClick as (event: unknown) => void)(event);
  await new Promise(setImmediate);
  assert.equal(h.opened.length, 1);
  assert.equal(render().props["aria-label"], "Открываем загрузку");
  h.dispose();
});

test("an acknowledgement-capable shell reports the matching native launch failure", async () => {
  const h = setup("Mozilla/5.0 (Windows NT 10.0; Win64; x64) FalconDesktop/0.1.0 FalconUpdateHandoff/1");
  const render = () => h.render().find(node => node.props["data-testid"] === "desktop-update")!;
  render();
  await new Promise(setImmediate);
  (render().props.onClick as (event: unknown) => void)({ preventDefault() {} });
  await new Promise(setImmediate);
  const requestId = new URLSearchParams(new URL(h.opened[0]).hash.slice(1)).get("falcon-update");
  assert.ok(requestId);
  h.acknowledge({ requestId: "previous-attempt", opened: true });
  assert.equal(render().props["aria-busy"], true);
  h.acknowledge({ requestId, opened: false });
  h.finishHandoff();
  assert.equal(render().props["aria-busy"], undefined);
  assert.equal(h.render().find(node => node.props.role === "alert")?.props.children, "Could not open the download. Try again.");
  h.dispose();
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


test("company administration offers an update to an outdated Mac build", async () => {
  const h = componentHarness(undefined, {
    navigator: { userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) FalconDesktop/0.2.6" },
  });
  const useTmsLocale = () => ({ locale: "en" });
  const { DesktopUpdateControl } = h.load<{ DesktopUpdateControl: () => unknown }>(
    new URL("../../presentation/update/DesktopUpdateControl.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale };
      if (name.endsWith("/update")) return { loadDesktopUpdate: async (identity: Parameters<typeof getDesktopUpdate>[0]) => {
        const update = await getDesktopUpdate(identity, release);
        return update ? { ...update, release } : null;
      } };
    });
  const { CompanyAdminFrame } = h.load<{ CompanyAdminFrame: (props: { back: string }) => unknown }>(
    new URL("../../../company-administration/presentation/layout/CompanyAdminFrame.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale };
      if (name.endsWith("administration-copy")) return { administrationCopy: () => ({ admin: "Company administration" }) };
      if (name.endsWith("DesktopUpdateControl")) return { DesktopUpdateControl };
    });
  const frame = nodes(h.render(() => CompanyAdminFrame({ back: "/work/" })));
  const update = frame.find(node => node.type === (DesktopUpdateControl as unknown));
  assert.ok(update, "the admin frame mounts the desktop update control");
  h.render(DesktopUpdateControl);
  await new Promise(setImmediate);
  const action = nodes(h.render(DesktopUpdateControl)).find(node => node.props["data-testid"] === "desktop-update");
  assert.equal(action?.props["aria-label"], `Download Falcon ${release.version} update`);
  h.dispose();
});
