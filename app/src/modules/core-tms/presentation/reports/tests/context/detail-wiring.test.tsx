import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { Defect, TestRunSummary } from "../../../../../../core/tms/contracts/legacy-contract";
import { useDefectExecutionContext } from "../../../../defects/execution-context/state/useDefectExecutionContext";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { DefectReportDetail } from "../../detail/DefectReportDetail";
import type { DefectReportContent } from "../../detail/content/DefectReportContent";

test("report detail passes scoped source context before the unchanged body and keeps archived navigation", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const inputs: unknown[] = [];
  const context = { pending: false, error: false };
  const loaded = h.load<{ DefectReportDetail: typeof DefectReportDetail }>(
    new URL("../../detail/DefectReportDetail.tsx", import.meta.url), name => {
      if (name.endsWith("useDefectExecutionContext")) return { useDefectExecutionContext: (input: unknown) => { inputs.push(input); return context; } };
      for (const key of ["DefectReportHeader", "DefectReportProperties", "DefectExecutionContext", "DefectReportContent", "DefectDiscussion", "DefectReportAttachments"]) {
        if (name.endsWith(key)) return { [key]: key };
      }
      return undefined;
    });
  const defect = { id: "bug", projectId: "project", runId: "original", runItemId: "original-item", archivedAt: "2026-11-13",
    attachmentIds: [], linkIds: [], description: "Original **Markdown**" } as unknown as Defect;
  const source = { id: "original", projectId: "project" } as TestRunSummary;
  const onOpenRun = () => {};
  const tree = nodes(h.render(() => loaded.DefectReportDetail({ workspaceId: "workspace", connected: true,
    defect, run: source, links: [], tab: "overview", onTabChange() {}, onBack() {}, onOpenRun })));
  assert.equal(inputs.length, 1);
  const input = inputs[0] as Parameters<typeof useDefectExecutionContext>[0];
  assert.equal(input.workspaceId, "workspace"); assert.equal(input.connected, true);
  assert.equal(input.defect, defect); assert.equal(input.run, source);
  const execution = tree.find(node => node.type === "DefectExecutionContext");
  const body = tree.find(node => node.type === "DefectReportContent");
  assert.ok(execution && body); assert.ok(tree.indexOf(execution) < tree.indexOf(body));
  assert.equal(execution.props.context, context); assert.equal(execution.props.onOpenRun, onOpenRun);
  assert.equal(body.props.defect, defect);
  assert.equal(tree[0].props["data-defect-archived"], true);
  assert.ok(!tree.some(node => node.type === "DefectDiscussion"));
});

test("report content sends description and actual/expected Markdown through intact without inventing steps", t => {
  const h = componentHarness(); t.after(() => h.dispose());
  const loaded = h.load<{ DefectReportContent: typeof DefectReportContent }>(
    new URL("../../detail/content/DefectReportContent.tsx", import.meta.url), name => {
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ t: (key: string) => key }) };
      if (name.endsWith("MarkdownField")) return { MarkdownField: "MarkdownField" };
      return undefined;
    });
  const defect = { description: "### User text\n\n1. **Pay**\n2. [Check](https://example.test)",
    actualResult: "```json\n{\"status\": 500}\n```", expectedResult: "| State | Result |\n| --- | --- |\n| Paid | Success |" } as Defect;
  const markdown = nodes(h.render(() => loaded.DefectReportContent({ defect }))).filter(node => node.type === "MarkdownField");
  assert.deepEqual(markdown.map(node => node.props.value), [defect.description, defect.actualResult, defect.expectedResult]);
  assert.ok(markdown.every(node => node.props.allowAttachments === false && !node.props.onChange));
});

test("source-context hook remains usable without an HTTP provider in disconnected previews", async () => {
  let state!: ReturnType<typeof useDefectExecutionContext>;
  let tree!: ReactTestRenderer;
  const defect = { id: "bug", projectId: "project", runId: "original", runItemId: "original-item" } as Defect;
  function Probe({ connected }: { connected: boolean }) {
    state = useDefectExecutionContext({ workspaceId: "workspace", defect, connected }); return null;
  }
  try {
    await act(async () => { tree = create(<Probe connected={false} />); });
    assert.deepEqual(state, { pending: false, error: false });
    await act(async () => tree.update(<Probe connected />));
    assert.deepEqual(state, { pending: false, error: true });
  } finally { await act(async () => tree?.unmount()); }
});
