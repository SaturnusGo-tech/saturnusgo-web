import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import { hooksCopy } from "../../../shared/hooks-copy";
import { configurationInput, createEmptyRoute, type YouTrackConfigurationDraft } from "../../../../../youtrack/model/youtrack-settings";
import type { ConnectionSection } from "../../sections/ConnectionSection";

const copy = hooksCopy(false);
test("connection controls preserve an omitted stored token until a user explicitly enters a replacement", () => {
  const h = componentHarness(); let draft: YouTrackConfigurationDraft = { enabled: true, baseUrl: "https://youtrack.example/", apiToken: "", routes: [createEmptyRoute("default", true)] };
  const { ConnectionSection: View } = h.load<{ ConnectionSection: typeof ConnectionSection }>(new URL("../../sections/ConnectionSection.tsx", import.meta.url));
  let connected = 0;
  const render = () => nodes(h.render(() => View({ copy, draft, tokenConfigured: true, showToken: false, connectedProjects: 1, action: "idle", onToggleToken() {},
    onUpdate: change => { draft = change(draft); }, onConnect: () => connected++, canDisconnect: true, onChangeConnection() {} })));
  const all = render(), inputs = all.filter(node => node.type === "IntegrationInput");
  assert.equal(inputs.length, 2); assert.equal(inputs[1].props.value, "");
  assert.equal(configurationInput(draft).apiToken, undefined);
  invoke(inputs[0], "onValueChange", "https://other.example/youtrack/");
  assert.equal(draft.baseUrl, "https://other.example/youtrack/"); assert.equal(draft.apiToken, "");
  invoke(inputs[1], "onValueChange", "perm:sample-replacement-token-1234567890");
  assert.equal(configurationInput(draft).apiToken, "perm:sample-replacement-token-1234567890");
  const enable = render().find(node => node.type === "IntegrationCheckbox")!;
  invoke(enable, "onValueChange", false); assert.equal(draft.enabled, false);
  invoke(render().find(node => node.type === "IntegrationButton" && node.props.onPress && node.props.isDisabled !== undefined && nodes(node.props.children).some(child => child.type === "RefreshCw"))!, "onPress");
  assert.equal(connected, 1);
});
