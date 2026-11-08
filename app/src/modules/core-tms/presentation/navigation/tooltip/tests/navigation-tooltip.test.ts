import assert from "node:assert/strict";
import test from "node:test";
import type { ReactElement } from "react";
import type { FalconTooltip } from "../../../common/tooltip/FalconTooltip";
import type { NavigationTooltip } from "../NavigationTooltip";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";

const trigger = { type: "button", props: { "aria-label": "Test runs, 2 active" }, key: null } as ReactElement;

test("rail tooltip uses the shared Falcon tooltip and preserves the original trigger", () => {
  const harness = componentHarness();
  const { NavigationTooltip: renderTooltip } = harness.load<{ NavigationTooltip: typeof NavigationTooltip }>(
    new URL("../NavigationTooltip.tsx", import.meta.url),
  );
  const [tooltip] = nodes(harness.render(() => renderTooltip({ enabled: true, label: "Test runs", children: trigger })));
  assert.equal(tooltip.type, "FalconTooltip");
  assert.equal(tooltip.props.label, "Test runs");
  assert.equal(tooltip.props.placement, "right");
  assert.equal(tooltip.props.isDisabled, false);
  assert.equal(tooltip.props.children, trigger);
});

test("the expanded rail suppresses its tooltip through HeroUI", () => {
  const harness = componentHarness();
  const { NavigationTooltip: renderTooltip } = harness.load<{ NavigationTooltip: typeof NavigationTooltip }>(
    new URL("../NavigationTooltip.tsx", import.meta.url),
  );
  const [tooltip] = nodes(harness.render(() => renderTooltip({ enabled: false, label: "Test runs", children: trigger })));
  assert.equal(tooltip.props.isDisabled, true);
});

test("shared tooltip renders the HeroUI primitive with the Docs fade configuration", () => {
  const harness = componentHarness();
  const { FalconTooltip: renderTooltip } = harness.load<{ FalconTooltip: typeof FalconTooltip }>(
    new URL("../../../common/tooltip/FalconTooltip.tsx", import.meta.url),
  );
  const [tooltip] = nodes(harness.render(() => renderTooltip({ label: "Test runs", placement: "right", children: trigger })));
  assert.equal(tooltip.type, "Tooltip");
  assert.equal(tooltip.props.content, "Test runs");
  assert.equal(tooltip.props.disableAnimation, true);
  assert.equal(tooltip.props.delay, 450);
  assert.equal(tooltip.props.children, trigger);
});
