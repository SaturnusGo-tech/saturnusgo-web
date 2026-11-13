import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import ts from "typescript";
import type { Suite, TestCaseSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { resolvePendingOperation } from "../../../../../../core/tms/idempotency/pending-operation";
import type { saveSuite } from "../../../../application/suites/saveSuite";
import { matchesSuite } from "../../../../helpers/suites/matchesSuite";
import type { SuiteDialog } from "../SuiteDialog";
import { getSuiteDialogCopy } from "../copy";
import * as selection from "../state/suite-selection";

type Input = Parameters<typeof saveSuite>[0];
type Props = Parameters<typeof SuiteDialog>[0];
const item = (id: string, extra = {}) => ({ id, key: `QA-${id}`, projectId: "p", title: `Case ${id}`, tags: ["smoke"],
  folderPath: "/Host", priority: "high", lifecycle: "ready", archivedAt: null, ...extra } as TestCaseSummary);
const suite = (extra = {}) => ({ id: "suite", name: "Release", description: "Original", projectId: "p", type: "static", caseIds: ["a"], filter: {}, ...extra } as Suite);

function setup(overrides: Partial<Props> = {}) {
  const calls: Input[] = [], saved: Suite[] = [];
  let fail = false, previewLoading = false, previewError = false, retries = 0;
  let membership: Pick<Suite, "projectId" | "type" | "caseIds" | "filter"> | undefined;
  const http = {}, module = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL("../SuiteDialog.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, crypto: globalThis.crypto,
    require: (name: string) => {
      if (name === "react") return React;
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name.endsWith(".css")) return { default: new Proxy({}, { get: (_object, key) => String(key) }) };
      if (name.endsWith("/Icon")) return { ArrowLeft: "svg" };
      if (name.endsWith("useFormLeave")) return { useFormLeave: () => ({ release() {}, close: (action: () => void) => action() }) };
      if (name.endsWith("copy")) return { getSuiteDialogCopy };
      if (name.endsWith("suite-selection")) return selection;
      if (name.endsWith("pending-operation")) return { resolvePendingOperation };
      if (name.endsWith("mutation-failure")) return { toTmsMutationFailure: () => ({}), formatTmsMutationFailure: () => "Network failed. Try again." };
      if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
      if (name.endsWith("useSuitePreview")) return { useSuitePreview: (cases: TestCaseSummary[], value: typeof membership, folders: Props["folders"]) => {
        membership = value; return { cases: value ? cases.filter(entry => matchesSuite(entry, value, folders, new Set(["a"]))) : [],
          loading: previewLoading, error: previewError, retry: () => { retries++; } };
      } };
      if (name.endsWith("saveSuite")) return { saveSuite: async (input: Input) => {
        calls.push(input); if (fail) throw new Error("Network failure"); return { data: suite({ name: input.name }), etag: "new-etag" };
      } };
      return new Proxy({}, { get: (_object, key) => String(key) });
    },
  });
  const { SuiteDialog: Editor } = module.exports as { SuiteDialog: typeof SuiteDialog };
  const props: Props = { projectId: "p", projectName: "Project", cases: [item("a"), item("b")], folders: [], offline: false,
    onClose() {}, onSaved: value => saved.push(value), ...overrides };
  let view: ReactTestRenderer;
  const render = () => act(() => { if (view) view.update(<Editor {...props} />); else view = create(<Editor {...props} />); });
  render();
  const fields = () => view!.root.find(node => String(node.type) === "SuiteEditableFields");
  const picker = () => view!.root.find(node => String(node.type) === "SuiteCasePicker");
  return { calls, saved, fields, picker, membership: () => membership!, setFail: (value: boolean) => { fail = value; },
    setPreview: (loading: boolean, error: boolean) => { previewLoading = loading; previewError = error; render(); }, retries: () => retries,
    change: (name: string, value: unknown) => act(() => fields().props[name](value)),
    toggle: (id: string) => act(() => picker().props.onToggle(id)),
    submitDisabled: () => view!.root.findByProps({ type: "submit" }).props.disabled,
    submit: async () => { await act(async () => { await view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); }); },
    errors: () => view!.root.findAll(node => String(node.type) === "FormError"), root: () => view!.root,
    dispose: () => act(() => view!.unmount()) };
}

test("new manual suite starts empty even when available cases have smoke tags", async () => {
  const h = setup();
  try {
    assert.equal(h.fields().props.type, "static"); assert.equal(h.picker().props.selected.size, 0);
    h.change("onName", "Release smoke"); assert.equal(h.submitDisabled(), true);
    await h.submit(); assert.equal(h.calls.length, 0);
    h.toggle("b"); assert.equal(Boolean(h.submitDisabled()), false);
    await h.submit(); assert.deepEqual(h.calls[0].caseIds, ["b"]); assert.equal(h.saved.length, 1);
  } finally { h.dispose(); }
});
test("editing static membership retains unloaded IDs when a visible selection is toggled", async () => {
  const h = setup({ suite: suite({ caseIds: ["a", "unloaded-case"] }), suiteEtag: "suite-v4" });
  try {
    assert.deepEqual([...h.picker().props.selected], ["a", "unloaded-case"]);
    h.toggle("a"); h.toggle("b"); await h.submit();
    assert.deepEqual(h.calls[0].caseIds, ["unloaded-case", "b"]); assert.equal(h.calls[0].suiteEtag, "suite-v4");
  } finally { h.dispose(); }
});
test("folder and text dynamic rules keep empty tags, remain saveable, and survive a rename", async () => {
  const filters = [{ folderPathPrefix: "/Host" }, { folderPathPrefix: "/Host", text: "booking", priority: ["high"] }];
  for (const filter of filters) {
    const h = setup({ suite: suite({ type: "dynamic", caseIds: [], filter }), suiteEtag: "suite-v2" });
    try {
      assert.equal(h.fields().props.tags, ""); assert.equal(h.picker().props.readonly, true);
      assert.equal(Boolean(h.submitDisabled()), false); assert.deepEqual(JSON.parse(JSON.stringify(h.membership().filter)), { ...filter, tags: [] });
      h.change("onName", "Renamed dynamic suite"); await h.submit();
      assert.equal(h.calls[0].name, "Renamed dynamic suite"); assert.equal(h.calls[0].tags.length, 0);
      assert.deepEqual(h.calls[0].suite?.filter, filter); assert.deepEqual(h.fields().props.retainedFilter, filter);
    } finally { h.dispose(); }
  }
});
test("a failed save preserves the full draft and reuses its operation key until the draft changes", async () => {
  const h = setup({ suite: suite({ caseIds: ["a", "unloaded"] }), suiteEtag: "suite-v3" });
  try {
    h.change("onName", "Edited release"); h.change("onDescription", "## Release\n\n**Risk:** payments"); h.toggle("b");
    h.setFail(true); await h.submit();
    assert.equal(h.errors().length, 1); assert.equal(Boolean(h.submitDisabled()), false); assert.equal(h.saved.length, 0);
    assert.equal(h.fields().props.name, "Edited release"); assert.equal(h.fields().props.description, "## Release\n\n**Risk:** payments");
    assert.deepEqual([...h.picker().props.selected], ["a", "unloaded", "b"]);
    await h.submit(); assert.equal(h.calls[0].operationKey, h.calls[1].operationKey);
    h.change("onDescription", "A different draft"); await h.submit(); assert.notEqual(h.calls[1].operationKey, h.calls[2].operationKey);
    h.setFail(false); await h.submit(); assert.equal(h.calls[2].operationKey, h.calls[3].operationKey);
    assert.equal(h.saved.length, 1); assert.equal(h.errors().length, 0);
  } finally { h.dispose(); }
});
test("dynamic preview errors block persistence and expose retry without discarding the draft", async () => {
  const h = setup({ suite: suite({ type: "dynamic", filter: { tags: [] } }), suiteEtag: "suite-v1" });
  try {
    h.change("onName", "Keep this name"); h.setPreview(false, true);
    assert.equal(Boolean(h.submitDisabled()), true); await h.submit(); assert.equal(h.calls.length, 0);
    const retry = h.root().find(node => String(node.type) === "ErrorToast" && node.props.retryLabel === "Retry");
    act(() => retry.props.onRetry()); assert.equal(h.retries(), 1);
    h.setPreview(false, false); assert.equal(h.fields().props.name, "Keep this name"); assert.equal(Boolean(h.submitDisabled()), false);
  } finally { h.dispose(); }
});
