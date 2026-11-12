import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { IntegrationControlScope } from "../../scope/IntegrationControlScope";
import { installSelectFixture, setSelectReducedMotion } from "./select-fixture";

Object.assign(globalThis, { React });
const restore = installSelectFixture();
const { IntegrationSelect } = require("../../select/IntegrationSelect") as typeof import("../../select/IntegrationSelect");
const { IntegrationMultiSelect } = require("../../multi-select/IntegrationMultiSelect") as typeof import("../../multi-select/IntegrationMultiSelect");
restore();

test("single and multiple select portals close on disabled scope and stay closed after re-enabling", async () => {
  for (const multiple of [false, true]) {
    let view!: ReactTestRenderer;
    const options = [{ value: "one", label: "One" }];
    const render = (disabled: boolean) => <IntegrationControlScope disabled={disabled}>
      {multiple ? <IntegrationMultiSelect aria-label="Status" options={options} values={["retired"]} onValuesChange={() => {}}/>
        : <IntegrationSelect aria-label="Status" options={options} value="retired" onValueChange={() => {}}/>}
    </IntegrationControlScope>;
    try {
      await act(async () => { view = create(render(false)); });
      const control = () => view.root.findByProps({ "data-test-select": true });
      assert.equal(control().props.isOpen, false);
      assert.deepEqual(control().props.selectedKeys, ["value:retired"]);
      await act(async () => control().props.onOpenChange(true));
      assert.equal(control().props.isOpen, true);
      await act(async () => view.update(render(true)));
      assert.equal(control().props.isDisabled, true);
      assert.equal(control().props.isOpen, false);
      await act(async () => view.update(render(false)));
      assert.equal(control().props.isDisabled, false);
      assert.equal(control().props.isOpen, false);
      assert.deepEqual(control().props.selectedKeys, ["value:retired"]);
    } finally { await act(async () => view?.unmount()); }
  }
});

test("single selection cannot toggle off its current item but an explicit empty option remains a valid choice", async () => {
  const changes: string[] = [];
  let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(<IntegrationSelect aria-label="Mapping" value="one"
      options={[{ value: "", label: "Keep unchanged" }, { value: "one", label: "One" }]} onValueChange={value => changes.push(value)}/>); });
    const control = view.root.findByProps({ "data-test-select": true });
    assert.equal(control.props.disallowEmptySelection, true, "HeroUI must retain an already-selected native-select value");
    await act(async () => control.props.onSelectionChange(new Set(["value:"])));
    assert.deepEqual(changes, [""], "the explicit empty option still clears an optional mapping");
  } finally { await act(async () => view?.unmount()); }
});

test("visible labels are not duplicated by aria-label; unlabelled controls retain their accessible name", async () => {
  let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(<IntegrationSelect label="State field" value="" options={[]} onValueChange={() => {}}/>); });
    const control = () => view.root.findByProps({ "data-test-select": true });
    assert.equal(control().props["aria-label"], undefined);
    assert.equal(control().props.listboxProps["aria-label"], "State field");
    await act(async () => view.update(<IntegrationMultiSelect label="Statuses" aria-label="Accepted statuses" values={[]} options={[]} onValuesChange={() => {}}/>));
    assert.equal(control().props["aria-label"], undefined);
    assert.equal(control().props.listboxProps["aria-label"], "Accepted statuses");
    await act(async () => view.update(<IntegrationSelect aria-label="Destination" value="" options={[]} onValueChange={() => {}}/>));
    assert.equal(control().props["aria-label"], "Destination");
  } finally { await act(async () => view?.unmount()); }
});

test("single and multiple menus fade without changing geometry and honor reduced motion", async () => {
  for (const multiple of [false, true]) {
    let view!: ReactTestRenderer;
    const render = () => multiple
      ? <IntegrationMultiSelect aria-label="Statuses" options={[]} values={[]} onValuesChange={() => {}}/>
      : <IntegrationSelect aria-label="Project" options={[]} value="" onValueChange={() => {}}/>;
    try {
      setSelectReducedMotion(false);
      await act(async () => { view = create(render()); });
      const control = () => view.root.findByProps({ "data-test-select": true });
      assert.equal(control().props.disableAnimation, undefined, "default animation policy remains inheritable from HeroUIProvider");
      const motion = control().props.popoverProps.motionProps;
      assert.deepEqual(Object.keys(motion.variants).sort(), ["enter", "exit", "initial"]);
      for (const [state, variant] of Object.entries(motion.variants)) {
        assert.deepEqual(Object.keys(variant as object), ["opacity"], `${state} must not scale, translate or resize a positioned menu`);
      }
      assert.equal(motion.variants.enter.opacity, 1);
      assert.equal(motion.variants.initial.opacity, 0);
      assert.equal(motion.variants.exit.opacity, 0);
      assert.ok(motion.transition.duration > 0 && motion.transition.duration <= .15, "the fade stays short and bounded");
      setSelectReducedMotion(true);
      await act(async () => view.update(render()));
      assert.equal(control().props.disableAnimation, true, "HeroUI must skip its motion wrapper and exit animation");
    } finally { setSelectReducedMotion(false); await act(async () => view?.unmount()); }
  }
});
