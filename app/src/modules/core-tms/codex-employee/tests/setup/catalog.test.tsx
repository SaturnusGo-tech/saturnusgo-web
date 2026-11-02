import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { integrationScreen } from "../../../presentation/hooks/hooks-navigation";
import { act, create } from "react-test-renderer";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previous = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { IntegrationCatalog } = require("../../../presentation/hooks/catalog/IntegrationCatalog") as typeof import("../../../presentation/hooks/catalog/IntegrationCatalog");
const { hooksCopy } = require("../../../presentation/hooks/shared/hooks-copy") as typeof import("../../../presentation/hooks/shared/hooks-copy");
if (previous) require.extensions[".css"] = previous; else delete require.extensions[".css"];
Object.defineProperty(globalThis, "window", { value: { location: { href: "https://company.test/" } }, configurable: true });
test("AI category and search expose a working Codex tile to managed users", () => {
  let opened = false;
  const view = create(<IntegrationCatalog russian={false} copy={hooksCopy(false)} configuration={null} status={null} statusFailed={false}
    onRefresh={() => {}} onOpenYouTrack={() => {}} onOpenCodex={() => { opened = true; }} codexStatus="available" showCodex
    swaggerStatus="available" connections={[]} connectorState="ready" projectId="p" onOpenConnector={() => {}} />);
  const ai = view.root.findAllByType("button").find(node => node.children.includes("AI"))!;
  act(() => ai.props.onClick());
  const codex = view.root.findAllByType("button").find(node => node.findAllByType("strong").some(strong => strong.children.includes("Codex")));
  assert.ok(codex);
  act(() => codex.props.onClick());
  assert.equal(opened, true);
  const search = view.root.findByProps({ type: "search" });
  act(() => search.props.onChange({ target: { value: "not-codex" } }));
  assert.match(JSON.stringify(view.toJSON()), /No services here/);
});

test("deep links and history searches resolve stable integration IDs", () => {
  assert.equal(integrationScreen("?view=hooks&integration=codex"), "codex");
  assert.equal(integrationScreen("?view=hooks"), "catalog");
  assert.equal(integrationScreen("?integration=youtrack"), "youtrack");
  assert.equal(integrationScreen("?integration=unknown"), "catalog");
});
