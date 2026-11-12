import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness, invoke, nodes } from "../../../../../portfolios/tests/support/component-harness";
import { createEmptyRoute, statusLabel, type YouTrackStatus } from "../../../../../youtrack/model/youtrack-settings";
import type { StatusMultiSelect } from "../../sections/workflow/controls/StatusMultiSelect";
import type { OutboundSelect } from "../../sections/workflow/controls/OutboundSelect";

const statuses: YouTrackStatus[] = [
  { id: "ready-42", name: "Ready", localizedName: "Готово", ordinal: 1, isResolved: false, archived: false },
  { id: "done-99", name: "Done", localizedName: null, ordinal: 2, isResolved: true, archived: false },
];
const resolve = (name: string) => name.endsWith("youtrack-settings") ? { statusLabel } : undefined;
test("multi-selection uses status IDs and retains unavailable stored IDs until explicit discovery reconciles them", () => {
  const h = componentHarness(); let changed: string[] = [];
  const { StatusMultiSelect: View } = h.load<{ StatusMultiSelect: typeof StatusMultiSelect }>(new URL("../../sections/workflow/controls/StatusMultiSelect.tsx", import.meta.url), resolve);
  const props = { label: "Ready statuses", statuses, values: ["unavailable", "ready-42"], placeholder: "Choose", onChange: (values: string[]) => { changed = values; } };
  const select = nodes(h.render(() => View(props)))[0];
  assert.deepEqual(Array.from(select.props.values as string[]), ["ready-42"]);
  invoke(select, "onValuesChange", ["done-99"]); assert.deepEqual(Array.from(changed), ["unavailable", "done-99"]);
  assert.equal(nodes(h.render(() => View({ ...props, statuses: [] })))[0].props.isDisabled, true);
});
test("outbound controls restrict Verified to accepted statuses and explicitly clear a mapping to null", () => {
  const h = componentHarness(); let route = createEmptyRoute("route-1");
  route.workflow.inbound.readyForRetest = ["ready-42"]; route.workflow.inbound.accepted = ["done-99"]; route.workflow.outbound.verified = "done-99";
  const { OutboundSelect: View } = h.load<{ OutboundSelect: typeof OutboundSelect }>(new URL("../../sections/workflow/controls/OutboundSelect.tsx", import.meta.url), resolve);
  const select = nodes(h.render(() => View({ label: "Verified", route, state: "verified", statuses, empty: "Do not change", onUpdate: change => { route = change(route); } })))[0];
  assert.deepEqual(Array.from(select.props.options as { value: string }[], option => option.value), ["", "done-99"]);
  invoke(select, "onValueChange", ""); assert.equal(route.workflow.outbound.verified, null);
  assert.deepEqual(route.workflow.inbound.accepted, ["done-99"]);
});
