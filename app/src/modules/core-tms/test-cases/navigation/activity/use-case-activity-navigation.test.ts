import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../portfolios/tests/support/component-harness";
import type { useCaseActivityNavigation } from "./useCaseActivityNavigation";

test("retest handoff reveals activity only for the selected case and supports restored history", () => {
  const h = componentHarness("https://tms.example/work/?projectId=p&caseId=c&caseTab=activity");
  const hook = h.load<{ useCaseActivityNavigation: typeof useCaseActivityNavigation }>(new URL("./useCaseActivityNavigation.ts", import.meta.url));
  let tab = "overview";
  const show = (next: string) => { tab = next; };
  h.render(() => hook.useCaseActivityNavigation("p", "c", show));
  assert.equal(tab, "activity");
  tab = "overview"; h.navigate("https://tms.example/work/?projectId=p&caseId=other&caseTab=activity");
  h.emit("falcon:navigation"); assert.equal(tab, "overview");
  h.navigate("https://tms.example/work/?projectId=p&caseId=c&caseTab=activity");
  h.emit("popstate"); assert.equal(tab, "activity");
  h.dispose(); tab = "overview"; h.emit("popstate"); assert.equal(tab, "overview");
});
