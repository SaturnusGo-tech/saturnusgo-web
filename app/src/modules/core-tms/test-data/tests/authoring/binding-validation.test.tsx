import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../application/context/TestDataContext";
import type { TestDataBinding } from "../../model/bindings/binding";
import { installRenderControls } from "../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let StaticEditor: typeof import("../../presentation/static/StaticDataEditor")["StaticDataEditor"];
let SourceSelector: typeof import("../../presentation/selector/SourceSelector")["SourceSelector"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try {
  StaticEditor = require("../../presentation/static/StaticDataEditor").StaticDataEditor;
  SourceSelector = require("../../presentation/selector/SourceSelector").SourceSelector;
} finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const configuration = { enabled: true, credentialsAvailable: true, limits: { datasetFields: 50 } };
import { createTmsHttpClient } from "../../../../../core/tms/transport/http";
import { createExecutionDataClient } from "../../data/execution/execution-client";
test("Static, Credential and Dataset forms retain invalid alias input, then accept its corrected value", async () => {
  for (const kind of ["STATIC", "CREDENTIAL", "DATASET"] as const) {
    let accepted = false, saved: TestDataBinding | undefined, calls = 0;
    const http = createTmsHttpClient({ apiBase: "https://falcon.example.test/api/v1", credentials: "include", fetch: (async () => {
      calls++;
      return accepted ? new Response(JSON.stringify({ data: { valid: true, errors: [], warnings: [], variables: [], referencedResources: [] } }))
        : new Response(JSON.stringify({ error: { code: "VALIDATION_ERROR", message: "Request validation failed", requestId: "req-alias",
          details: [{ field: "bindings.0.alias", code: "invalid_format", message: "Request field is invalid." }] } }), { status: 400 });
    }) as typeof fetch });
    const resource = { id: "source", name: "QA Account", disabled: false, fields: [], ...(kind === "DATASET" ? { currentVersionId: "v1", currentVersion: 1, fieldCount: 1 } : {}) };
    const value = { actorId: "qa", projectId: "p", configuration, permissions: { read: true, bind: true }, port: {
      ...createExecutionDataClient(http, "p"), credentials: async () => ({ items: [resource], cursor: null }), datasets: async () => ({ items: [resource], cursor: null }),
      version: async () => ({ id: "v1", version: 1, fields: [] }), versions: async () => ({ items: [{ id: "v1", version: 1, fields: [] }], cursor: null }),
    } } as unknown as TestDataContextValue;
    let view: ReturnType<typeof create>;
    await act(async () => { view = create(<TestDataProvider value={value}>{kind === "STATIC"
      ? <StaticEditor ru={false} onSave={binding => { saved = binding; }} onClose={() => {}} />
      : <SourceSelector kind={kind} ru={false} onSave={binding => { saved = binding; }} onClose={() => {}} />}</TestDataProvider>); await new Promise(resolve => setTimeout(resolve, 10)); });
    const set = (label: string, text: string) => view!.root.findAllByType("input").find(input => (input.props["aria-label"] ?? input.props.label) === label)!.props.onValueChange(text);
    if (kind !== "STATIC") await act(async () => { view!.root.findAllByType("button").find(button => button.props["aria-pressed"] === false)!.props.onPress(); });
    await act(async () => { set("Alias", "qa account"); if (kind === "STATIC") { set("Name", "QA data"); set("Value", "Synthetic value"); } });
    await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
    assert.equal(calls, 1, `${kind}: validate before accepting binding`);
    assert.equal(saved, undefined, `${kind}: invalid binding must not flash in the case`);
    assert.equal(view!.root.findAllByProps({ role: "alert" }).length > 0, true);
    const alias = view!.root.findAllByType("input").find(input => input.props.label === "Alias")!;
    assert.equal(alias.props.value, "qa account");
    assert.equal(alias.props.isInvalid, true);
    accepted = true;
    await act(async () => set("Alias", "qaAccount"));
    await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
    assert.equal((saved as TestDataBinding | undefined)?.alias, "qaAccount");
    await act(async () => view!.unmount());
  }
});
