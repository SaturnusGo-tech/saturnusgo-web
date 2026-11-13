import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import { AuthoringLeaveCoordinator } from "../../application/leave-coordinator";
import type { transitionEnvironmentLayout } from "../../../../presentation/config/environments/motion/layout-transition";

test("environment selection keeps its approved leave active through delayed DOM commit and animation", async t => {
  const coordinator = new AuthoringLeaveCoordinator();
  coordinator.register("editor", () => ({ dirty: true })); coordinator.setPresenter(async () => true);
  const transitions: { update(): void; finish(): void }[] = [];
  const document = { documentElement: { dataset: {} }, startViewTransition(update: () => void) {
    let committed!: () => void, finished!: () => void;
    const updateCallbackDone = new Promise<void>(resolve => { committed = resolve; });
    const completed = new Promise<void>(resolve => { finished = resolve; });
    transitions.push({ update() { update(); committed(); }, finish: finished });
    return { updateCallbackDone, finished: completed, skipTransition() {} };
  } };
  const h = componentHarness(undefined, { document }); t.after(() => h.dispose()); let toggles = 0;
  const motion = h.load<{ transitionEnvironmentLayout: typeof transitionEnvironmentLayout }>(new URL("../../../../presentation/config/environments/motion/layout-transition.ts", import.meta.url), name =>
    name === "react-dom" ? { flushSync: (update: () => void) => update() } : undefined);
  const { EnvironmentSettings: View } = h.load<{ EnvironmentSettings: (props: Record<string, unknown>) => unknown }>(new URL("../../../../presentation/config/sections/EnvironmentSettings.tsx", import.meta.url), name => {
    if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: coordinator.request.bind(coordinator) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", t: (key: string) => key }) };
    if (name.endsWith("layout-transition")) return motion;
    return undefined;
  });
  const render = () => nodes(h.render(() => View({ environments: [{ id: "env", name: "Staging", key: "STG", baseUrl: "https://test" }],
    projectId: "p", projectName: "Project", offline: false, onSaved() {},
    onToggle() { void coordinator.request(() => { toggles++; }); } })));
  const row = () => render().find(node => node.type === "EnvironmentRow")!;
  const select = invoke(row(), "onEdit") as Promise<boolean>;
  await Promise.resolve(); assert.equal(coordinator.isPending(), true); assert.equal(row().props.editor, undefined);
  transitions[0].update(); await Promise.resolve(); assert.equal(coordinator.isPending(), true, "animation has not finished");
  assert.ok(row().props.editor); transitions[0].finish(); await select; assert.equal(coordinator.isPending(), false);
  const toggle = invoke(row(), "onToggle") as Promise<boolean>; await Promise.resolve();
  transitions[1].update(); assert.equal(toggles, 1, "nested parent action retains approval at delayed commit");
  transitions[1].finish(); await toggle; assert.equal(coordinator.isPending(), false);
});
