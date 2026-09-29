import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";
import { findLatestDefectRetest } from "../../application/defect/find-latest-defect-retest";
import type { useDefectRetestContext } from "../../state/defect/useDefectRetestContext";
import { mapRun } from "../../../data/run-mapper";
import { run } from "../fixtures/verification-fixture";
import { gate, tick } from "../defect/retest-harness";

test("retest context drops a late result after switching the selected defect", async () => {
  const h = componentHarness(); const read = gate<{ data: { defectId: string }[] }>();
  const { useDefectRetestContext: hook } = h.load<{ useDefectRetestContext: typeof useDefectRetestContext }>(
    new URL("../../state/defect/useDefectRetestContext.ts", import.meta.url), name => {
      if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
      if (name.endsWith("find-latest-defect-retest")) return { findLatestDefectRetest };
      if (name.endsWith("collect-verification-entries")) return { collectRunVerification: async (get: (offset: number) => Promise<{ data: unknown[] }>) => (await get(0)).data };
      if (name.endsWith("verification-api")) return { getRunVerification: () => read.promise };
    });
  const http = {}; const runs = [mapRun(run)];
  const render = (defect: string) => h.render(() => hook("workspace", "project-1", defect, runs, true, false));
  render("bug-1"); await tick(); render("bug-2");
  read.resolve({ data: [{ defectId: "bug-1" }] }); await tick();
  assert.equal(render("bug-2").latest, null);
  assert.equal(render("bug-2").contextError, false); h.dispose();
});
