import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes } from "../../../portfolios/tests/support/component-harness";
import type { NotificationPreferencesEntry } from "../../composition/standalone/NotificationPreferencesEntry";

test("static preferences entry defers browser UI while retaining locale and authentication boundaries", async () => {
  let windowImports = 0;
  let deferred: (() => Promise<unknown>) | undefined;
  let serverRendering: boolean | undefined;
  const h = componentHarness();
  const { NotificationPreferencesEntry: Entry } = h.load<{ NotificationPreferencesEntry: typeof NotificationPreferencesEntry }>(
    new URL("../../composition/standalone/NotificationPreferencesEntry.tsx", import.meta.url), name => {
      if (name === "next/dynamic") return { default: (load: () => Promise<unknown>, options: { ssr: boolean }) => {
        deferred = load; serverRendering = options.ssr; return "DeferredPreferences";
      } };
      if (name.endsWith("NotificationPreferencesWindow")) { windowImports++; return { NotificationPreferencesWindow: "PreferencesWindow" }; }
      if (name.endsWith("TmsLocaleProvider")) return { TmsLocaleProvider: "LocaleProvider" };
      if (name.endsWith("TmsAuthBoundary")) return { TmsAuthBoundary: "AuthBoundary" };
      return undefined;
    });
  const tree = nodes(h.render(Entry));
  assert.equal(windowImports, 0, "browser UI must not become an eager async server module");
  assert.equal(serverRendering, false);
  assert.deepEqual(tree.map(node => node.type), ["LocaleProvider", "AuthBoundary", "DeferredPreferences"]);
  assert.ok(deferred);
  assert.equal(await deferred(), "PreferencesWindow");
  assert.equal(windowImports, 1);
});
