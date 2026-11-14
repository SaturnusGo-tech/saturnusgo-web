import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import { authoringLeave } from "../../../../authoring/leave/application/authoring-leave";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Library: typeof import("../../../presentation/library/TestDataLibrary")["TestDataLibrary"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try { Library = require("../../../presentation/library/TestDataLibrary").TestDataLibrary; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const pause = () => new Promise(resolve => setTimeout(resolve, 10));
test("workspace tree separates static values, datasets and credentials; selection opens in the same pane", async () => {
  let legacyCalls = 0;
  const dataset = { id: "customers", name: "Customers", description: "", status: "ACTIVE", revision: 1, sources: [], views: [], createdAt: "2026-11-14", updatedAt: "2026-11-14" };
  const value = { actorId: "qa", projectId: "project", environments: [], configuration: { enabled: true, credentialsAvailable: true, limits: {} },
    permissions: { read: true, create: true }, port: { datasets: async () => { legacyCalls++; return { items: [], cursor: null }; } },
    workspace: { datasets: async () => ({ items: [dataset], cursor: null }), staticResources: async () => ({ items: [{ ...dataset, id: "minimum", name: "Minimum payment amount", dataType: "Decimal", value: "0.01", warnings: [], environmentId: null, currentVersionId: "minimum-v1" }], cursor: null }) },
  } as unknown as TestDataContextValue;
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}><TestDataProvider value={value}><Library /></TestDataProvider></TmsLocaleContext.Provider>); await pause(); });
  assert.equal(legacyCalls, 0, "table dataset screen does not eagerly load legacy field maps");
  for (const label of ["Static Data", "Shared Datasets", "Secure Credentials"]) assert.ok(view!.root.findAllByType("button").some(button => button.props["aria-label"] === label));
  await act(async () => view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Open Customers")!.props.onPress());
  assert.equal(view!.root.findByProps({ "data-dataset-workspace": "customers" }).props["data-dataset-workspace"], "customers");
  assert.equal(view!.root.findAllByType("dialog").length, 0);
  await act(async () => { view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Static Data")!.props.onPress(); await pause(); });
  assert.equal(view!.root.findAllByProps({ "data-dataset-workspace": "customers" }).length, 0, "opening a category leaves the previously opened resource");
  assert.equal(view!.root.findAllByType("button").filter(button => button.props["aria-current"] === "page").length, 0, "categories do not select or highlight their first resource");
  await act(async () => view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Open Minimum payment amount")!.props.onPress());
  assert.equal(view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Open Minimum payment amount")!.props["aria-current"], "page", "only an explicit resource click selects it");
  const unregister = authoringLeave.register("category-leave-test", () => ({ dirty: true }));
  try {
    await act(async () => view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Static Data")!.props.onPress());
    assert.equal(view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Open Minimum payment amount")!.props["aria-current"], "page", "a declined leave keeps the selected resource");
  } finally { unregister(); }
  await act(async () => view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Create static data")!.props.onPress());
  assert.ok(view!.root.findAllByProps({ label: "Name" }).length);
  assert.equal(view!.root.findAllByProps({ "data-dataset-workspace": "customers" }).length, 0);
  await act(async () => view!.unmount());
});
