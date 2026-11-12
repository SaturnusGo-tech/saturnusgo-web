import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, nodes } from "../../../../../portfolios/tests/support/component-harness";
import { hooksCopy } from "../../../shared/hooks-copy";
import type { YouTrackSettingsForm } from "../../form/YouTrackSettingsForm";

const copy = hooksCopy(false);
test("the control scope disables the real section for read-only users and while a settings operation runs", () => {
  const h = componentHarness();
  const { YouTrackSettingsForm: View } = h.load<{ YouTrackSettingsForm: typeof YouTrackSettingsForm }>(new URL("../../form/YouTrackSettingsForm.tsx", import.meta.url));
  const state = { configuration: { tokenConfigured: true }, draft: {}, selectedProjects: [], action: "idle", setShowToken() {}, updateDraft() {}, connect() {} } as unknown as Parameters<typeof View>[0]["state"];
  const render = (canManage: boolean) => nodes(h.render(() => View({ copy, state, webhook: { setup: null, status: "idle" }, canManage, onChangeConnection() {}, russian: false })));
  assert.equal(render(false).find(node => node.type === "IntegrationControlScope")?.props.disabled, true);
  assert.equal(render(true).find(node => node.type === "IntegrationControlScope")?.props.disabled, false);
  state.action = "saving"; assert.equal(render(true).find(node => node.type === "IntegrationControlScope")?.props.disabled, true);
  assert.equal(render(false).some(node => node.type === "WebhookSection"), false);
});
