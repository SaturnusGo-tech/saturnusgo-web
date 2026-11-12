import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import { hooksCopy } from "../../../shared/hooks-copy";
import { createEmptyRoute, type YouTrackConfigurationDraft } from "../../../../../youtrack/model/youtrack-settings";
import type { RoutingRule } from "../../sections/routing/RoutingRule";
import type { ProjectSelect } from "../../sections/routing/ProjectSelect";

const copy = hooksCopy(false);
test("routing controls update the exact rule and keep a destination change separate from matcher edits", () => {
  const h = componentHarness(), selected: string[][] = [];
  let draft: YouTrackConfigurationDraft = { enabled: true, baseUrl: "https://youtrack.example/", apiToken: "", routes: [createEmptyRoute("default", true), createEmptyRoute("rule-42")] };
  const { RoutingRule: View } = h.load<{ RoutingRule: typeof RoutingRule }>(new URL("../../sections/routing/RoutingRule.tsx", import.meta.url));
  const render = () => nodes(h.render(() => View({ route: draft.routes[1], projects: [], copy, loading: false,
    onUpdate: change => { draft = change(draft); }, onSelectProject: (...args) => selected.push(args) })));
  invoke(render().find(node => node.type === "IntegrationSelect")!, "onValueChange", "tag");
  invoke(render().find(node => node.type === "IntegrationInput")!, "onValueChange", "release");
  assert.equal(draft.routes[1].match?.field, "tag"); assert.equal(draft.routes[1].match?.value, "release");
  assert.equal(draft.routes[0].match, null);
  invoke(render().find(node => node.type === "ProjectSelect")!, "onChange", "project-99");
  assert.deepEqual(selected, [["rule-42", "project-99"]]);
  invoke(render().find(node => node.type === "IntegrationCheckbox")!, "onValueChange", false);
  assert.equal(draft.routes[1].enabled, false);
  assert.equal(render().find(node => node.type === "IntegrationSelect")?.props.isDisabled, true);
  assert.equal(render().find(node => node.type === "IntegrationInput")?.props.isDisabled, true);
});
test("project selection is inert while loading or unavailable and never substitutes the first project", () => {
  const h = componentHarness(), selected: string[] = [];
  const { ProjectSelect: View } = h.load<{ ProjectSelect: typeof ProjectSelect }>(new URL("../../sections/routing/ProjectSelect.tsx", import.meta.url));
  const props = { value: "saved-id", projects: [{ id: "new-id", name: "Current", shortName: "CUR" }], copy, label: "Destination", loading: true, onChange: (value: string) => selected.push(value) };
  const first = nodes(h.render(() => View(props)))[0];
  assert.equal(first.props.value, "saved-id"); assert.equal(first.props.isDisabled, true); assert.deepEqual(selected, []);
  assert.equal(nodes(h.render(() => View({ ...props, loading: false, projects: [] })))[0].props.isDisabled, true);
  invoke(nodes(h.render(() => View({ ...props, loading: false })))[0], "onValueChange", "new-id");
  assert.deepEqual(selected, ["new-id"]);
});
