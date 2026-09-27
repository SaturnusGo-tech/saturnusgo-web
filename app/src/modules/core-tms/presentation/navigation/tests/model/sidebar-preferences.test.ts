import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_SIDEBAR_PREFERENCES, parseSidebarPreferences, sidebarPreferenceKey } from "../../model/sidebar-preferences";

test("missing, corrupt and unexpected persisted values safely default to full mode", () => {
  for (const raw of [null, "", "{broken", "null", "[]", "true", '"contextual"', '{"mode":"tracked","pinned":null}']) {
    assert.deepEqual(parseSidebarPreferences(raw), DEFAULT_SIDEBAR_PREFERENCES);
  }
});

test("persisted pins reject unknown routes, canonicalize imports and deduplicate in stable order", () => {
  assert.deepEqual(parseSidebarPreferences(JSON.stringify({ mode: "contextual", pinned: ["hooks", "imports", "cases", "not-a-route", "help", 5, null, "dashboard"] })), {
    mode: "contextual", pinned: ["dashboard", "cases", "hooks"],
  });
  assert.deepEqual(parseSidebarPreferences('{"mode":"contextual","pinned":"hooks"}'), { mode: "contextual", pinned: [] });
});

test("scope keys distinguish workspace, subject, anonymous and delimiter-like identifiers", () => {
  const keys = [sidebarPreferenceKey("a", "user"), sidebarPreferenceKey("b", "user"), sidebarPreferenceKey("a", "other"),
    sidebarPreferenceKey("a", null), sidebarPreferenceKey("a", "anonymous"), sidebarPreferenceKey("a:b", "c"), sidebarPreferenceKey("a", "b:c")];
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(sidebarPreferenceKey("a", undefined), sidebarPreferenceKey("a", null));
});
