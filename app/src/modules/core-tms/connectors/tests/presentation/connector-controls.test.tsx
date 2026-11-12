import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { connectionDraft } from "../../model/connector-draft";
import type { ConnectionInput } from "../../model/connector-types";

Object.assign(globalThis, { React });
const loader = require("node:module"), previous = loader._load, previousCss = require.extensions[".css"];
const names = ["Input", "Select", "Checkbox", "Switch", "Button", "ControlScope"];
require.extensions[".css"] = (module: NodeModule) => { module.exports = {}; };
loader._load = function(name: string, parent: NodeModule, main: boolean) {
  const kind = names.find(value => name.endsWith(`/Integration${value}`));
  return kind ? { [`Integration${kind}`]: `control-${kind.toLowerCase()}` } : previous.call(this, name, parent, main);
};
const { CredentialFields } = require("../../presentation/connection/CredentialFields");
const { AutomationPanel } = require("../../presentation/automation/AutomationPanel");
const { ActivityPanel } = require("../../presentation/activity/ActivityPanel");
loader._load = previous;
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];

test("credential controls preserve stored-secret omission and immutable binding", () => {
  let changed: ConnectionInput | undefined;
  const draft = connectionDraft("jira", null); draft.settings.remoteId = "QA";
  const view = create(<CredentialFields provider="jira" ru={false} draft={draft} stored bound onChange={(value: ConnectionInput) => { changed = value; }} />);
  const inputs = view.root.findAllByType("control-input" as never);
  assert.equal(inputs.length, 4);
  const token = inputs.find(input => input.props.label === "API token")!;
  assert.equal(token.props.type, "password");
  token.props.onValueChange("replacement");
  assert.equal(changed?.secrets.apiToken, "replacement");
  token.props.onValueChange("");
  assert.deepEqual(changed?.secrets, {});
  assert.equal(inputs.find(input => input.props.label === "Site URL")?.props.isDisabled, true);
  assert.equal(inputs.find(input => input.props.label === "Jira project key")?.props.isDisabled, true);
  view.unmount();
});

test("tracker controls remove an empty outbound mapping and preserve event IDs", () => {
  let changed: ConnectionInput | undefined;
  const draft = connectionDraft("linear", null); draft.settings.outboundStatuses = { open: "todo" };
  const view = create(<AutomationPanel provider="linear" ru={false} draft={draft} discovery={null} catalog={{}} onChange={(value: ConnectionInput) => { changed = value; }} />);
  const select = view.root.findAllByType("control-select" as never).find(input => input.props["aria-label"] === "Open → linear")!;
  assert.ok(select, "outbound mapping uses the accessible shared Select");
  select.props.onValueChange("");
  assert.deepEqual(changed?.settings.outboundStatuses, {});
  const event = view.root.findAllByType("control-checkbox" as never)[0];
  event.props.onValueChange(false);
  assert.deepEqual(changed?.settings.events, draft.settings.events.filter(value => value !== "defect.created"));
  view.unmount();
});

test("uncertain delivery verification trims its ID and remains an explicit action", () => {
  const calls: unknown[] = [];
  const snapshot = { connection: { provider: "confluence" }, deliveries: [{ id: "d", status: "uncertain", event: "run.complete", direction: "outbound", targetId: "r", createdAt: "2026-11-12T00:00:00Z", attempts: 1 }], links: [], nextCursor: null };
  const view = create(<ActivityPanel snapshot={snapshot} ru={false} canManage pending={null} refreshFailed={false} onRecover={(...args: unknown[]) => calls.push(args)} onMore={() => {}} onRefresh={() => {}} onRepublish={() => {}} />);
  act(() => view.root.findAllByType("control-button" as never).find(button => button.children.includes("Restore link"))!.props.onPress());
  const input = view.root.findByType("control-input" as never);
  assert.equal(input.props.label, "Created record ID");
  act(() => input.props.onValueChange("  page-42  "));
  const verify = view.root.findAllByType("control-button" as never).find(button => button.children.includes("Verify and link"))!;
  assert.equal(verify.props.isDisabled, false);
  act(() => verify.props.onPress());
  assert.deepEqual(calls, [["d", "page-42"]]);
  view.unmount();
});
