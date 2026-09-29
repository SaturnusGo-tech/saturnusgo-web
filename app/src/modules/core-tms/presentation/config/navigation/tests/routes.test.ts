import assert from "node:assert/strict";
import { test } from "node:test";
import { readSettingsSection, settingsSectionLink } from "../settings-section-route";
import { buildWorkspaceDeepLink, readWorkspaceDeepLink } from "../../../../state/navigation/workspace-deep-link";

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
