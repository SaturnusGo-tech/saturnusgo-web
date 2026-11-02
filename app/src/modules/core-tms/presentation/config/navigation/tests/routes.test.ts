import assert from "node:assert/strict";
import { test } from "node:test";
import { readSettingsSection, settingsSectionLink } from "../settings-section-route";
import { buildWorkspaceDeepLink, readWorkspaceDeepLink } from "../../../../state/navigation/workspace-deep-link";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { settingsCopy, settingsSections } from "../settings-sections";
import type { ConfigView } from "../../ConfigView";
import type { AppearanceSettings } from "../../settings/AppearanceSettings";

const origin = "https://falcon.example/work/?workspaceId=w&view=notifications";
const scope = { workspaceId: "w", projectId: "", view: "config" as const, runId: null };
test("legacy notifications open personal Settings and canonicalize without losing their destination", () => {
  assert.equal(readWorkspaceDeepLink(origin).view, "config"); assert.equal(readSettingsSection(origin), "notifications");
  const next = buildWorkspaceDeepLink(origin, scope), query = new URL(next).searchParams;
  assert.equal(query.get("view"), "config"); assert.equal(query.get("settings"), "notifications");
  assert.equal(buildWorkspaceDeepLink(next, scope), next);
  assert.equal(new URL(buildWorkspaceDeepLink(origin, { ...scope, view: "notifications" })).searchParams.get("settings"), "notifications");
});

test("notification, account and environment deep links work without a project and clear unrelated screen selections", () => {
  for (const section of ["notifications", "account", "environments"] as const) {
    const href = new URL(settingsSectionLink(`${origin}&runId=old&caseId=old#section`, section), origin).href;
    assert.equal(readSettingsSection(href), section);
    const query = new URL(href).searchParams;
    assert.equal(query.has("projectId"), false); assert.equal(query.has("runId"), false); assert.equal(query.has("caseId"), false);
    assert.equal(new URL(buildWorkspaceDeepLink(href, scope)).searchParams.get("settings"), section);
  }
});

test("invalid settings targets are ignored and settings state cannot leak into unrelated screens", () => {
  const href = "https://falcon.example/work/?workspaceId=w&view=config&settings=../../private";
  assert.equal(readSettingsSection(href), "general"); assert.equal(new URL(buildWorkspaceDeepLink(href, scope)).searchParams.has("settings"), false);
  const valid = new URL(settingsSectionLink(origin, "notifications"), origin).href;
  assert.equal(new URL(buildWorkspaceDeepLink(valid, { ...scope, view: "cases" })).searchParams.has("settings"), false);
});

function settingsHarness(locale: "en" | "ru" = "en", hasProject = true, initial = "general") {
  const h = componentHarness();
  let selected = initial;
  const { ConfigView: render } = h.load<{ ConfigView: typeof ConfigView }>(new URL("../../ConfigView.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale }) };
    if (name.endsWith("settings-sections")) return { settingsCopy, settingsSections };
    if (name.endsWith("useSettingsSection")) return { useSettingsSection: () => ({ section: selected, select: (next: string) => { selected = next; } }) };
  });
  const draw = () => nodes(h.render(() => render({ environments: [], project: hasProject ? { id: "p", name: "Falcon project" } : undefined,
    exchange: { type: "ImportContent", props: {} } } as never)));
  return { draw, selected: () => selected };
}

test("settings search filters translated categories without changing the open section", () => {
  const h = settingsHarness();
  let all = h.draw();
  const search = all.find(node => node.type === "input" && node.props.type === "search");
  assert.ok(search, "settings category search is available");
  invoke(search, "onChange", { target: { value: "  LANGUAGE " } });
  all = h.draw();
  const choices = all.filter(node => node.type === "button" && node.props["aria-controls"]);
  assert.equal(choices.length, 1);
  assert.equal(choices[0].props["aria-controls"], "settings-appearance");
  assert.equal(h.selected(), "general");
  assert.equal(all.find(node => node.props.id === "settings-general")?.props.hidden, false);
  invoke(choices[0], "onClick");
  assert.equal(h.selected(), "appearance");
});

test("empty settings search can be cleared and personal settings never reveal project categories", () => {
  const h = settingsHarness("ru", false, "appearance");
  let all = h.draw();
  const search = all.find(node => node.type === "input" && node.props.type === "search");
  assert.ok(search);
  invoke(search, "onChange", { target: { value: "несуществующее" } });
  all = h.draw();
  assert.ok(all.some(node => node.props.role === "status"));
  assert.equal(all.filter(node => node.type === "button" && node.props["aria-controls"]).length, 0);
  invoke(all.find(node => node.type === "button" && node.props["aria-label"] === "Очистить поиск")!, "onClick");
  const targets = h.draw().filter(node => node.type === "button" && node.props["aria-controls"]).map(node => node.props["aria-controls"]);
  assert.deepEqual(targets, ["settings-appearance", "settings-notifications", "settings-account"]);
});

test("import settings keep category navigation and a single selected content panel", () => {
  const all = settingsHarness("en", true, "exchange").draw();
  assert.ok(all.some(node => node.type === "nav"));
  assert.ok(all.some(node => node.type === "ImportContent"));
  const active = all.filter(node => node.type === "section" && node.props.hidden === false);
  assert.equal(active.length, 1);
  assert.equal(active[0].props.id, "settings-exchange");
});

test("native appearance controls keep animated theme changes and validate language selections", () => {
  const h = componentHarness();
  const toggles: unknown[] = [], languages: string[] = [];
  const { AppearanceSettings: render } = h.load<{ AppearanceSettings: typeof AppearanceSettings }>(new URL("../../settings/AppearanceSettings.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key, setLocale: (value: string) => languages.push(value) }) };
    if (name.endsWith("useColorMode")) return { useColorMode: () => ({ isLight: true, toggleAnimated: (position: unknown) => toggles.push(position) }) };
  });
  const all = nodes(h.render(render));
  const theme = all.find(node => node.type === "select" && node.props.value === "light");
  const language = all.find(node => node.type === "select" && node.props.value === "en");
  assert.ok(theme, "theme uses a compact native select"); assert.ok(language);
  const currentTarget = { getBoundingClientRect: () => ({ left: 20, top: 10, width: 100, height: 30 }) };
  invoke(theme, "onChange", { target: { value: "light" }, currentTarget });
  assert.equal(toggles.length, 0);
  invoke(theme, "onChange", { target: { value: "dark" }, currentTarget });
  assert.equal(toggles.length, 1);
  assert.equal((toggles[0] as { x: number }).x, 70); assert.equal((toggles[0] as { y: number }).y, 25);
  invoke(language, "onChange", { target: { value: "ru" } });
  invoke(language, "onChange", { target: { value: "unsupported" } });
  assert.deepEqual(languages, ["ru"]);
});
