import assert from "node:assert/strict";
import { test } from "node:test";
import { componentHarness, nodes } from "../../../../../portfolios/tests/support/component-harness";
import { runProgress } from "../../../workbench/rows/progress/model";
import type { DetailProgress, DetailStatus } from "../RecordSignals";
test("progress exposes exact completed totals, excludes in-progress checks and keeps a valid empty range", t => {
  const h = componentHarness(); t.after(h.dispose);
  const View = h.load<{ DetailProgress: typeof DetailProgress; DetailStatus: typeof DetailStatus }>(new URL("../RecordSignals.tsx", import.meta.url), name => {
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("progress/model")) return { runProgress };
    if (name.endsWith("/labels")) return { localizedLabel: (_locale: string, value: string) => value };
  });
  const progress = { total: 12, passed: 5, failed: 1, blocked: 1, skipped: 1, inProgress: 2, notRun: 2 };
  let tree = nodes(h.render(() => View.DetailProgress({ progress })));
  const bar = tree.find(node => node.props.role === "progressbar")!;
  assert.equal(bar.props["aria-valuenow"], 8); assert.equal(bar.props["aria-valuemax"], 12); assert.equal(bar.props["aria-valuetext"], "8 of 12 checks with a result");
  tree = nodes(h.render(() => View.DetailProgress({ progress: { total: 0, passed: 0, failed: 0, blocked: 0, skipped: 0, inProgress: 0, notRun: 0 } })));
  assert.equal(tree.find(node => node.props.role === "progressbar")!.props["aria-valuemax"], 1);
  const status = nodes(h.render(() => View.DetailStatus({ status: "ready_for_retest" })))[0]; assert.equal(status.props.title, "ready_for_retest");
});
