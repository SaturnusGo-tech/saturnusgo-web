import assert from "node:assert/strict";
import test from "node:test";
import { TmsApiError } from "../../../../../../core/tms/transport/http";
import { defaultPreferences, type DashboardPreferences } from "../../preferences/preferences";
import type { PersonalView, PersonalViewSource } from "../../preferences/data/personal-view-source";
import { DashboardPreferenceSync } from "../../preferences/sync/dashboard-preference-sync";
import { isDashboardInitialPending } from "../../../../presentation/dashboard/loading/readiness/initial-pending";

type View = Extract<PersonalView, { kind: "preferences" }>;
const resource = (rowVersion: number, preferences = defaultPreferences) => ({
  etag: `"dashboard-personal-view:${rowVersion}"`,
  data: { kind: "preferences" as const, rowVersion, updatedAt: null, preferences },
});
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const idle = () => new Promise<void>(resolve => setImmediate(resolve));
const legacy: DashboardPreferences = { ...defaultPreferences, period: "90d", section: "defects", environmentId: "qa", buildReference: "build-42" };
const covered = (sync: DashboardPreferenceSync) => isDashboardInitialPending({
  layoutPending: false, preferences: sync.getSnapshot(), analytics: { snapshot: {}, loading: false },
  workbench: { enabled: false, snapshot: null, loading: false },
});

test("initial default GET stays unready throughout a pending legacy import, then reveals saved preferences", async () => {
  const save = deferred<ReturnType<typeof resource>>();
  const source: PersonalViewSource<View> = { load: async () => resource(0), save: () => save.promise };
  const sync = new DashboardPreferenceSync(source, () => "legacy-command");
  const published: boolean[] = []; sync.subscribe(() => published.push(sync.getSnapshot().ready));
  sync.start(legacy); await idle();
  assert.equal(sync.getSnapshot().ready, false); assert.equal(sync.getSnapshot().stored, true);
  assert.ok(published.length > 0); assert.ok(published.every(ready => !ready));
  assert.equal(covered(sync), true, "the default query cannot become a visible dashboard during migration");
  save.resolve(resource(1, legacy)); await idle();
  assert.equal(sync.getSnapshot().ready, true); assert.equal(covered(sync), false);
  assert.deepEqual(sync.getSnapshot().value, legacy); sync.stop();
});

test("failed initial import releases the loader through stored=false and can retry the original command", async () => {
  let save = deferred<ReturnType<typeof resource>>(); const keys: string[] = [];
  let remote = resource(0);
  const source: PersonalViewSource<View> = { load: async () => remote, save: (_change, _etag, key) => { keys.push(key); return save.promise; } };
  const sync = new DashboardPreferenceSync(source, () => "legacy-command");
  sync.start(legacy); await idle(); save.reject(new Error("Network unavailable")); await idle();
  assert.equal(sync.getSnapshot().stored, false); assert.equal(covered(sync), false);
  save = deferred(); const retry = sync.refresh(); await idle();
  remote = resource(1, legacy); save.resolve(remote); await retry;
  assert.deepEqual(keys, ["legacy-command", "legacy-command"]);
  assert.equal(sync.getSnapshot().ready, true); assert.equal(sync.getSnapshot().stored, true);
  assert.deepEqual(sync.getSnapshot().value, legacy); sync.stop();
});

test("an import conflict remains covered until reloading the newer server version, which wins", async () => {
  const save = deferred<ReturnType<typeof resource>>(), reload = deferred<ReturnType<typeof resource>>();
  const newer = { ...defaultPreferences, period: "7d" as const, section: "runs" as const };
  let reads = 0; const etags: string[] = [];
  const source: PersonalViewSource<View> = {
    load: () => ++reads === 1 ? Promise.resolve(resource(0)) : reload.promise,
    save: (change, etag) => {
      assert.ok(change.kind === "preferences");
      etags.push(etag);
      return etags.length === 1 ? save.promise : Promise.resolve(resource(5, { ...newer, ...change.patch }));
    },
  };
  const sync = new DashboardPreferenceSync(source, () => "legacy-command");
  sync.start(legacy); await idle(); save.reject(new TmsApiError("Version changed", 412, null)); await idle();
  assert.equal(sync.getSnapshot().ready, false); assert.equal(covered(sync), true);
  reload.resolve(resource(4, newer)); await idle();
  assert.equal(sync.getSnapshot().ready, true); assert.equal(sync.getSnapshot().stored, true);
  assert.deepEqual(sync.getSnapshot().value, newer); assert.equal(etags.length, 1);
  sync.update({ buildReference: "new-build" }); await idle();
  assert.deepEqual(etags, [resource(0).etag, resource(4).etag], "a later user edit retains the authoritative server version");
  assert.deepEqual(sync.getSnapshot().value, { ...newer, buildReference: "new-build" }); sync.stop();
});

test("ordinary user changes keep readiness true while their PATCH is pending, including a new server row", async () => {
  const save = deferred<ReturnType<typeof resource>>();
  const source: PersonalViewSource<View> = { load: async () => resource(0), save: () => save.promise };
  const sync = new DashboardPreferenceSync(source, () => "user-command");
  sync.start(null); await idle(); assert.equal(sync.getSnapshot().ready, true);
  sync.update({ period: "7d" }); await idle();
  assert.equal(sync.getSnapshot().ready, true); assert.equal(covered(sync), false);
  assert.equal(sync.getSnapshot().value.period, "7d");
  save.resolve(resource(1, { ...defaultPreferences, period: "7d" })); await idle(); sync.stop();
});
