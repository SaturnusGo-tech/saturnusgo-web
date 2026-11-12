import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { installHeroFixture, setReducedMotion } from "./hero-fixture";

Object.assign(globalThis, { React });
// The installed test renderer carries React18 types while the application uses React19 types.
type RendererElement = Parameters<typeof create>[0];
const restore = installHeroFixture();
const { AnchoredSelect } = require("../../select/AnchoredSelect") as typeof import("../../select/AnchoredSelect");
const { AnchoredAutocomplete } = require("../../autocomplete/AnchoredAutocomplete") as typeof import("../../autocomplete/AnchoredAutocomplete");
const { AnchoredDropdown } = require("../../dropdown/AnchoredDropdown") as typeof import("../../dropdown/AnchoredDropdown");
const { AnchoredPopover } = require("../../popover/AnchoredPopover") as typeof import("../../popover/AnchoredPopover");
const { AnchoredFreeSoloPopover } = require("../../free-solo/AnchoredFreeSoloPopover") as typeof import("../../free-solo/AnchoredFreeSoloPopover");
restore();

const components = [AnchoredSelect, AnchoredAutocomplete, AnchoredDropdown, AnchoredPopover, AnchoredFreeSoloPopover];
test("anchored facades retain portal, controlled state, handlers and named exit continuation while removing geometric motion", async () => {
  for (const [index, Component] of components.entries()) {
    const Control = Component as React.ElementType;
    const nested = index < 2, phases: unknown[] = [], changes: boolean[] = [];
    const portal = {} as HTMLElement, triggerRef = React.createRef<HTMLElement>();
    const selectedKeys = new Set(["saved-id"]), onOpenChange = (open: boolean) => changes.push(open);
    const motionProps = { onAnimationComplete: (phase: unknown) => phases.push(phase), variants: { enter: { scale: .8, y: 8 } } };
    const placement = { portalContainer: portal, shouldCloseOnScroll: false, offset: 9, motionProps };
    const selection = index === 0 ? { selectedKeys } : index === 1 ? { selectedKey: "saved-id", inputValue: "Typed" } : { triggerRef };
    const props = { "aria-label": "Picker", isOpen: true, onOpenChange, ...selection,
      ...(nested ? { popoverProps: placement } : placement), children: [] };
    let view!: ReactTestRenderer;
    try {
      await act(async () => { view = create(<Control {...props}/> as unknown as RendererElement); });
      const hero = view.root.find(node => typeof node.type === "string" && node.type.startsWith("hero-"));
      const popup = nested ? hero.props.popoverProps : hero.props;
      assert.equal(popup.portalContainer, portal); assert.equal(popup.shouldCloseOnScroll, false); assert.equal(popup.offset, 9);
      if (index === 0) assert.equal(hero.props.selectedKeys, selectedKeys);
      else if (index === 1) { assert.equal(hero.props.selectedKey, "saved-id"); assert.equal(hero.props.inputValue, "Typed"); }
      else assert.equal(hero.props.triggerRef, triggerRef);
      assert.equal(hero.props.isOpen, true); hero.props.onOpenChange(false); assert.deepEqual(changes, [false]);
      assert.equal(hero.props.disableAnimation, undefined, "an absent flag must preserve HeroUIProvider inheritance");
      assert.deepEqual(Object.keys(popup.motionProps.variants).sort(), ["enter", "exit", "initial"]);
      for (const variant of Object.values(popup.motionProps.variants)) assert.deepEqual(Object.keys(variant as object), ["opacity"]);
      popup.motionProps.onAnimationComplete("exit"); assert.deepEqual(phases, ["exit"]);
    } finally { await act(async () => view?.unmount()); }
  }
});

test("generic item and selection APIs remain typed and controlled for Select and Autocomplete", async () => {
  const items = [{ id: "old-id", title: "Stored choice" }], changes: unknown[] = [];
  const select = <AnchoredSelect items={items} selectedKeys={new Set(["old-id"])} onSelectionChange={keys => changes.push(keys)}
    renderValue={values => values[0]?.data?.title ?? ""}>{item => <span key={item.id}>{item.title}</span>}</AnchoredSelect>;
  const autocomplete = <AnchoredAutocomplete items={items} selectedKey="old-id" inputValue="Search"
    onSelectionChange={key => changes.push(key)} onInputChange={value => changes.push(value)}>
    {item => <span key={item.id}>{item.title}</span>}
  </AnchoredAutocomplete>;
  assert.equal(select.props.items, items); assert.equal(autocomplete.props.items, items);
  for (const element of [select, autocomplete]) {
    const Control = element.type as React.ElementType;
    let view!: ReactTestRenderer;
    try {
      await act(async () => { view = create(<Control {...element.props}>{[]}</Control> as unknown as RendererElement); });
      const hero = view.root.find(node => typeof node.type === "string" && node.type.startsWith("hero-"));
      assert.equal(hero.props.items, items);
      hero.props.onSelectionChange("new-id");
      if (element === autocomplete) hero.props.onInputChange("Changed search");
    } finally { await act(async () => view?.unmount()); }
  }
  assert.deepEqual(changes, ["new-id", "new-id", "Changed search"]);
});

test("reduced motion wins while explicit top-level and nested instant modes retain their semantics", async () => {
  for (const [index, Component] of components.entries()) {
    const Control = Component as React.ElementType;
    let view!: ReactTestRenderer;
    const render = (disableAnimation?: boolean, nestedDisable?: boolean) => <Control aria-label="Picker" disableAnimation={disableAnimation}
      {...(index < 2 ? { popoverProps: { disableAnimation: nestedDisable } } : {})}>{[]}</Control>;
    try {
      setReducedMotion(false);
      await act(async () => { view = create(render(false, true) as unknown as RendererElement); });
      const hero = () => view.root.find(node => typeof node.type === "string" && node.type.startsWith("hero-"));
      assert.equal(hero().props.disableAnimation, false);
      if (index < 2) assert.equal(hero().props.popoverProps.disableAnimation, true);
      await act(async () => view.update(render(true, false) as unknown as RendererElement));
      assert.equal(hero().props.disableAnimation, true);
      if (index < 2) assert.equal(hero().props.popoverProps.disableAnimation, false, "retain the caller's nested override");
      setReducedMotion(true);
      await act(async () => view.update(render(false, false) as unknown as RendererElement));
      assert.equal(hero().props.disableAnimation, true);
      if (index < 2) assert.equal(hero().props.popoverProps.disableAnimation, true);
    } finally { setReducedMotion(false); await act(async () => view?.unmount()); }
  }
});

test("ref-capable HeroUI controls retain their native ref target", async () => {
  for (const Component of [AnchoredSelect, AnchoredAutocomplete, AnchoredPopover, AnchoredFreeSoloPopover]) {
    const Control = Component as React.ElementType;
    const ref = React.createRef<HTMLElement>(), node = { focus() {} }; let view!: ReactTestRenderer;
    try {
      await act(async () => { view = create(<Control ref={ref} aria-label="Picker">{[]}</Control> as unknown as RendererElement, { createNodeMock: () => node }); });
      assert.equal(ref.current, node);
    } finally { await act(async () => view?.unmount()); }
    assert.equal(ref.current, null);
  }
});
