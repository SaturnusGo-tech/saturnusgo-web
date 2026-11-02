import assert from "node:assert/strict";
import test from "node:test";
import { pluginSettingsLink, readPluginSettingsRoute } from "../plugin-settings-route";
import { settingsSectionLink } from "../../settings-section-route";
import { buildWorkspaceDeepLink } from "../../../../../state/navigation/workspace-deep-link";

const base = "https://falcon.test/work/?workspaceId=w&projectId=p&view=hooks&integration=codex&runId=old#details";
test("Manage opens a scoped settings detail, while Plugins returns to the list", () => {
  const detail = new URL(pluginSettingsLink(base, "codex"), base);
  assert.equal(readPluginSettingsRoute(detail.href), "codex");
  assert.deepEqual(Object.fromEntries(detail.searchParams), { workspaceId: "w", projectId: "p", view: "config", settings: "plugins", plugin: "codex" });
  assert.equal(detail.hash, "");
  for (const href of [pluginSettingsLink(detail.href, null), settingsSectionLink(detail.href, "plugins")]) {
    const list = new URL(href, base);
    assert.equal(readPluginSettingsRoute(list.href), null); assert.equal(list.searchParams.get("settings"), "plugins");
    assert.equal(list.searchParams.has("plugin"), false);
  }
});
test("plugin selectors do not open details outside Plugins settings or accept unknown plugins", () => {
  for (const query of ["view=hooks&plugin=codex", "view=config&settings=general&plugin=codex", "view=config&settings=plugins&plugin=../../secret", "view=config&settings=plugins&plugin=gitlab", "view=config&settings=plugins&plugin=jenkins", "view=config&settings=plugins&plugin=teamcity"])
    assert.equal(readPluginSettingsRoute(`https://falcon.test/work/?${query}`), null);
});
test("each implemented integration has a scoped Manage route and optional setup intent", () => {
  for (const id of ["codex", "youtrack", "jira", "linear", "trello", "github", "slack", "confluence", "swagger"] as const) {
    const detail = new URL(pluginSettingsLink(base, id, true), base);
    assert.equal(readPluginSettingsRoute(detail.href), id);
    assert.equal(detail.searchParams.get("pluginSetup"), "connect");
    const list = new URL(pluginSettingsLink(detail.href, null), base);
    assert.equal(list.searchParams.has("pluginSetup"), false);
    assert.equal(list.searchParams.has("plugin"), false);
  }
  for (const id of ["gitlab", "jenkins", "teamcity"] as const)
    assert.equal(readPluginSettingsRoute(new URL(pluginSettingsLink(base, id, true), base).href), null);
});
test("GitHub analysis review intent remains scoped to its manager", () => {
  const scope = { workspaceId: "w", projectId: "p", view: "config" as const, runId: null };
  const detail = `https://falcon.test${pluginSettingsLink(base, "github")}&impact=1&analysisId=analysis_12`;
  const canonical = new URL(buildWorkspaceDeepLink(detail, scope));
  assert.equal(canonical.searchParams.get("impact"), "1");
  assert.equal(canonical.searchParams.get("analysisId"), "analysis_12");
  for (const href of [detail.replace("plugin=github", "plugin=jira"), detail.replace("settings=plugins", "settings=general"), detail.replace("projectId=p", "projectId=elsewhere")]) {
    const clean = new URL(buildWorkspaceDeepLink(href, scope));
    assert.equal(clean.searchParams.has("impact"), false); assert.equal(clean.searchParams.has("analysisId"), false);
  }
  const invalid = new URL(buildWorkspaceDeepLink(detail.replace("analysis_12", "../../foreign"), scope));
  assert.equal(invalid.searchParams.has("analysisId"), false);
});
test("canonicalization retains Manage only in the current settings scope", () => {
  const detail = new URL(pluginSettingsLink(base, "codex"), base).href;
  const scope = { workspaceId: "w", projectId: "p", view: "config" as const, runId: null };
  const canonical = buildWorkspaceDeepLink(detail, scope);
  assert.equal(readPluginSettingsRoute(canonical), "codex");
  assert.equal(buildWorkspaceDeepLink(canonical, scope), canonical);
  for (const next of [{ ...scope, workspaceId: "other" }, { ...scope, projectId: "other" }, { ...scope, view: "hooks" as const }])
    assert.equal(new URL(buildWorkspaceDeepLink(detail, next)).searchParams.has("plugin"), false);
});
