import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import { installRenderControls } from "../../support/render-controls";

const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Library: typeof import("../../../presentation/library/TestDataLibrary")["TestDataLibrary"];
before(() => {
  Object.assign(globalThis, { React });
  const restore = installRenderControls();
  try { Library = require("../../../presentation/library/TestDataLibrary").TestDataLibrary; } finally { restore(); }
});
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const pause = () => new Promise(resolve => setTimeout(resolve, 10));

test("top filters update the existing catalog query without a persistent bottom panel", async () => {
  const queries: { archived: boolean; sort: string }[] = [];
  const value = {
    actorId: "qa", projectId: "project", environments: [], configuration: { enabled: true, credentialsAvailable: true, limits: {} },
    permissions: { read: true, create: true }, port: {},
    workspace: { datasets: async (_search: string, _cursor: string | null, _signal: AbortSignal, archived: boolean, sort: string) => {
      queries.push({ archived, sort }); return { items: [], cursor: null };
    } },
  } as unknown as TestDataContextValue;
  const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(<TmsLocaleContext.Provider value={locale}><TestDataProvider value={value}><Library /></TestDataProvider></TmsLocaleContext.Provider>);
    await pause();
  });
  try {
    assert.ok(view!.root.findAllByType("button").some(button => button.props["aria-label"] === "Test data filters"));
    assert.equal(view!.root.findAllByType("footer").length, 0);
    const popup = view!.root.findByType("popover" as never);
    assert.equal(popup.props.shouldBlockScroll, false);
    assert.equal(popup.props.disableAnimation, true);
    await act(async () => popup.props.onOpenChange(true));
    assert.equal(view!.root.findByType("popover" as never).props.isOpen, true);
    await act(async () => {
      view!.root.findByType("listbox" as never).props.onSelectionChange(new Set(["updatedAt"]));
      await pause();
    });
    assert.deepEqual(queries[queries.length - 1], { archived: false, sort: "updatedAt" });
    await act(async () => { view!.root.findByType("switch").props.onValueChange(true); await pause(); });
    assert.deepEqual(queries[queries.length - 1], { archived: true, sort: "updatedAt" });
    assert.equal(view!.root.findByType("popover" as never).props.isOpen, true, "changing catalog criteria keeps filter geometry stable");
  } finally { await act(async () => view!.unmount()); }
});
