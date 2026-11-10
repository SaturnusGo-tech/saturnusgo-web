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
Object.defineProperty(globalThis, "window", {
  value: Object.assign(new EventTarget(), { location: { href: "https://company.test/work/?workspaceId=w&projectId=p&view=hooks" } }),
  configurable: true,
});
test("AI category exposes a working Codex tile without a catalog playbook link", () => {
  let opened = false;
  const view = create(<IntegrationCatalog russian={false} copy={hooksCopy(false)} configuration={null} status={null} statusFailed={false}
    onRefresh={() => {}} onOpenYouTrack={() => {}} onOpenCodex={() => { opened = true; }} codexStatus="available" showCodex
    swaggerStatus="available" connections={[]} connectorState="ready" projectId="p" onOpenConnector={() => {}} />);
  act(() => view.root.findByProps({ "aria-label": "Catalog options" }).props.onClick());
  const ai = view.root.findAllByType("button").find(node => node.children.includes("AI"))!;
  act(() => ai.props.onClick());
  assert.equal(view.root.findAllByType("a").some(node => String(node.props.href).includes("article=codex-prompts")), false);
  const codex = view.root.findAllByType("button").find(node => node.findAllByType("strong").some(strong => strong.children.includes("Codex")));
  assert.ok(codex);
  act(() => codex.props.onClick());
  assert.equal(opened, true);
  const search = view.root.findByProps({ type: "search" });
  act(() => search.props.onChange({ target: { value: "not-codex" } }));
  assert.match(JSON.stringify(view.toJSON()), /No services here/);
});

test("catalog options filter existing services and Connect opens an actionable service only", () => {
  const opened: string[] = [];
  const view = create(<IntegrationCatalog russian={false} copy={hooksCopy(false)} configuration={null} status={null} statusFailed={false}
    onRefresh={() => {}} onOpenYouTrack={() => opened.push("youtrack")} onOpenCodex={() => opened.push("codex")} codexStatus="available" showCodex
    swaggerStatus="available" connections={[]} connectorState="ready" projectId="p" onOpenConnector={provider => opened.push(provider)} />);
  act(() => view.root.findByProps({ "aria-label": "Catalog options" }).props.onClick());
  const soon = view.root.findByProps({ role: "dialog" }).findAllByType("button").find(node => node.children.includes("Coming soon"))!;
  act(() => soon.props.onClick());
  assert.equal(view.root.findAllByType("strong").some(node => node.children.includes("GitLab")), true);
  assert.equal(view.root.findAllByType("strong").some(node => node.children.includes("YouTrack")), false);
  act(() => view.root.findByProps({ "aria-label": "Connect" }).props.onClick());
  const chooser = view.root.findByProps({ role: "dialog" });
  assert.equal(chooser.findAllByType("button").some(node => node.children.includes("GitLab")), false);
  act(() => chooser.findAllByType("button").find(node => node.children.includes("YouTrack"))!.props.onClick());
  assert.deepEqual(opened, ["youtrack"]);
  assert.equal(view.root.findAllByProps({ role: "dialog" }).length, 0);
  act(() => view.unmount());
});

test("API shortcut reuses its real catalog group and the options dialog closes on Escape", () => {
  const view = create(<IntegrationCatalog russian={false} copy={hooksCopy(false)} configuration={null} status={null} statusFailed={false}
    onRefresh={() => {}} onOpenYouTrack={() => {}} onOpenCodex={() => {}} codexStatus="available" showCodex
    swaggerStatus="available" connections={[]} connectorState="ready" projectId="p" onOpenConnector={() => {}} />);
  act(() => view.root.findAllByType("button").find(node => node.children.includes("API & contracts"))!.props.onClick());
  assert.deepEqual(view.root.findAllByType("strong").map(node => node.children[0]), ["Swagger"]);
  act(() => view.root.findByProps({ "aria-label": "Catalog options" }).props.onClick());
  const dialog = view.root.findByProps({ role: "dialog" });
  let prevented = false;
  act(() => dialog.parent!.props.onKeyDown({ key: "Escape", preventDefault() { prevented = true; }, stopPropagation() {} }));
  assert.equal(prevented, true);
  assert.equal(view.root.findAllByProps({ role: "dialog" }).length, 0);
  act(() => view.unmount());
});

test("deep links and history searches resolve stable integration IDs", () => {
  assert.equal(integrationScreen("?view=hooks&integration=codex"), "codex");
  assert.equal(integrationScreen("?view=hooks"), "catalog");
  assert.equal(integrationScreen("?integration=youtrack"), "youtrack");
  assert.equal(integrationScreen("?integration=unknown"), "catalog");
});
