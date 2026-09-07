import assert from "node:assert/strict";
import test from "node:test";
import type { Bootstrap } from "../../../../../../core/tms/contracts/legacy-contract";
import type { DashboardAnalyticsSource, DashboardDrill, DashboardDrillPage, DashboardSnapshot } from "../../../../dashboards/model/dashboard-analytics";
import { hookHarness } from "./hook-harness";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
const query = { workspaceId: "workspace", projectId: "a", period: "30d" as const };
const data = {} as Bootstrap;
const selection: DashboardDrill = { id: "runs:launched", label: "Launched", filter: { entity: "run", basis: "launched" } };
const snapshot = (projectId: string) => ({ query: { ...query, projectId } }) as DashboardSnapshot;
const page = (id: string) => ({ rows: [{ id }] }) as DashboardDrillPage;
const tick = async () => { await Promise.resolve(); await Promise.resolve(); };
function fixture() {
  const summaries: Array<ReturnType<typeof deferred<DashboardSnapshot>> & { signal?: AbortSignal }> = [];
  const drills: Array<ReturnType<typeof deferred<DashboardDrillPage>> & { signal?: AbortSignal }> = [];
  const source: DashboardAnalyticsSource = {
    summary: (_query, signal) => { const task = { ...deferred<DashboardSnapshot>(), signal }; summaries.push(task); return task.promise; },
    drill: (_request, signal) => { const task = { ...deferred<DashboardDrillPage>(), signal }; drills.push(task); return task.promise; },
  };
  const hook = hookHarness();
  return { hook, source, summaries, drills, render: (scope = query) => hook.render(data, scope, source) };
}

test("late successful summary from an aborted project cannot overwrite the current project", async () => {
  const f = fixture(); f.render();
  const projectB = { ...query, projectId: "b" };
  f.render(projectB);
  assert.equal(f.summaries[0].signal?.aborted, true);
  const fresh = snapshot("b");
  f.summaries[1].resolve(fresh); await tick();
  f.summaries[0].resolve(snapshot("a")); await tick();
  const state = f.render(projectB);
  assert.equal(state.snapshot, fresh);
  assert.equal(state.summaryLoading, false);
});

test("refresh cancels the older successful summary even when its source ignores AbortSignal", async () => {
  const f = fixture(); f.render().refresh(); f.render();
  f.summaries[0].resolve(snapshot("old")); await tick();
  assert.equal(f.render().snapshot, null);
  assert.equal(f.render().summaryLoading, true);
  const fresh = snapshot("a"); f.summaries[1].resolve(fresh); await tick();
  assert.equal(f.render().snapshot, fresh);
});

test("reopening the same drill id rejects an earlier response and preserves the new page", async () => {
  const f = fixture(); f.render().openDrill(selection); f.render().openDrill(selection);
  assert.equal(f.drills[0].signal?.aborted, true);
  const fresh = page("fresh"); f.drills[1].resolve(fresh); await tick();
  f.drills[0].resolve(page("stale")); await tick();
  assert.equal(f.render().drill.page, fresh);
  assert.equal(f.render().drill.loading, false);
});

test("a closed drill remains closed after its request completes", async () => {
  const f = fixture(); f.render().openDrill(selection); f.render().closeDrill();
  f.drills[0].resolve(page("closed")); await tick();
  const state = f.render();
  assert.equal(state.drill.selected, null); assert.equal(state.drill.page, null);
});

test("the first render in another project hides loaded summary and drill before effects clear state", async () => {
  const f = fixture(); f.render();
  const projectA = snapshot("a"); f.summaries[0].resolve(projectA); await tick();
  f.render().openDrill(selection);
  f.drills[0].resolve(page("project-a-item")); await tick();
  const loaded = f.render();
  assert.equal(loaded.snapshot, projectA);
  assert.equal(loaded.drill.page?.rows[0].id, "project-a-item");
  const projectB = { ...query, projectId: "b" };
  const firstRenderB = f.render(projectB);
  assert.equal(firstRenderB.snapshot, null);
  assert.equal(firstRenderB.drill.selected, null);
  assert.equal(firstRenderB.drill.page, null);
  assert.equal(firstRenderB.summaryLoading, true);
  assert.equal(firstRenderB.summaryError, false);
  const fresh = snapshot("b"); f.summaries[1].resolve(fresh); await tick();
  assert.equal(f.render(projectB).snapshot, fresh);
});

test("workspace-wide scope change also hides historical rows synchronously", async () => {
  const f = fixture(); f.render();
  f.summaries[0].resolve(snapshot("a")); await tick();
  assert.notEqual(f.render().snapshot, null);
  const workspaceQuery = { ...query, projectId: undefined };
  const firstWorkspaceRender = f.hook.render(data, workspaceQuery, f.source);
  assert.equal(firstWorkspaceRender.snapshot, null);
  assert.equal(firstWorkspaceRender.summaryLoading, true);
});

test("changing only the period hides values from the previous period on the first render", async () => {
  const f = fixture(); f.render();
  f.summaries[0].resolve(snapshot("a")); await tick();
  assert.notEqual(f.render().snapshot, null);
  const firstNinetyDays = f.hook.render(data, { ...query, period: "90d" }, f.source);
  assert.equal(firstNinetyDays.snapshot, null);
  assert.equal(firstNinetyDays.summaryLoading, true);
});
