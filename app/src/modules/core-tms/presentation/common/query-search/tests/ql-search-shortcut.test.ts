import assert from "node:assert/strict";
import test from "node:test";
import { isQlSearchShortcut } from "../ql-search-shortcut";
import { componentHarness, invoke, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { RepositoryQueryControls } from "../../../cases/browser/controls/RepositoryQueryControls";
import type { CasesToolbar } from "../../../cases/toolbar/CasesToolbar";

const key = (patch = {}) => ({ key: "l", metaKey: false, ctrlKey: false, altKey: false, shiftKey: false,
  defaultPrevented: false, ...patch });

test("QL shortcut accepts both platform modifiers without consuming ordinary typing or composition", () => {
  assert.equal(isQlSearchShortcut(key({ metaKey: true })), true);
  assert.equal(isQlSearchShortcut(key({ ctrlKey: true, key: "L" })), true);
  for (const patch of [{}, { metaKey: true, key: "k" }, { ctrlKey: true, altKey: true },
    { metaKey: true, shiftKey: true }, { metaKey: true, defaultPrevented: true },
    { metaKey: true, nativeEvent: { isComposing: true } }]) {
    assert.equal(isQlSearchShortcut(key(patch)), false);
  }
});

test("repository search opens QL in place, preserves its query, and ignores the shortcut while locked", () => {
  const h = componentHarness(undefined, { requestAnimationFrame() {} });
  const { RepositoryQueryControls: View } = h.load<{ RepositoryQueryControls: typeof RepositoryQueryControls }>(
    new URL("../../../cases/browser/controls/RepositoryQueryControls.tsx", import.meta.url), name => {
      if (name.endsWith("ql-search-shortcut")) return { isQlSearchShortcut };
      if (name.endsWith("case-field-filters")) return { fieldFilterCount: () => 0 };
    });
  const props = { locale: "ru", query: "", qlQuery: "priority:high", directory: { items: [] },
    filters: { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false },
    facets: { folders: [], components: [] }, options: { folders: [], components: [] }, tags: [],
    filterOpen: true, onFilterOpen(value: boolean) { props.filterOpen = value; } } as unknown as Parameters<typeof View>[0];
  const view = () => nodes(h.render(() => View(props)));
  const trigger = () => view().find(node => node.type === "Input")!;
  let prevented = 0;
  invoke(trigger(), "onKeyDown", { ...key({ metaKey: true }), preventDefault() { prevented++; }, stopPropagation() {} });
  assert.equal(prevented, 1); assert.equal(props.filterOpen, false);
  assert.equal(view().find(node => node.type === "QlDisclosure")?.props.open, true);
  assert.equal(view().find(node => node.type === "CaseQlAutocomplete")?.props.query, "priority:high");
  assert.equal(trigger().props.placeholder, "Найти кейсы или выполнить QL");
  assert.equal(view().some(node => node.type === "Button" && node.props.children === "QL"), false);
  props.disabled = true;
  invoke(trigger(), "onKeyDown", { ...key({ ctrlKey: true }), preventDefault() { prevented++; }, stopPropagation() {} });
  assert.equal(prevented, 1);
  assert.equal(view().find(node => node.type === "QlDisclosure")?.props.open, false);
});

test("legacy toolbar search also opens its existing editor without a separate QL launch button", () => {
  const h = componentHarness(undefined, { requestAnimationFrame() {} });
  const { CasesToolbar: View } = h.load<{ CasesToolbar: typeof CasesToolbar }>(
    new URL("../../../cases/toolbar/CasesToolbar.tsx", import.meta.url), name => {
      if (name.endsWith("ql-search-shortcut")) return { isQlSearchShortcut };
      if (name.endsWith("case-field-filters")) return { fieldFilterCount: () => 0 };
    });
  const props = { locale: "en", repositoryMode: true, query: "", selectedFolder: "", filters: { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false } } as unknown as Parameters<typeof View>[0];
  const view = () => nodes(h.render(() => View(props)));
  assert.equal(view().find(node => node.type === "QlDisclosure")?.props.open, false);
  invoke(view().find(node => node.type === "input")!, "onKeyDown", { ...key({ ctrlKey: true }), preventDefault() {}, stopPropagation() {} });
  assert.equal(view().find(node => node.type === "QlDisclosure")?.props.open, true);
  assert.equal(view().some(node => node.type === "button" && node.props.children === "QL"), false);
  assert.ok(view().some(node => node.type === "QlSearchHint"));
});

test("inline QL hint supports touch and has no action when disabled", () => {
  const h = componentHarness(undefined, { navigator: { platform: "MacIntel" } });
  const { QlSearchHint: View } = h.load<typeof import("../QlSearchHint")>(new URL("../QlSearchHint.tsx", import.meta.url));
  let opened = 0;
  const props = { ru: true, onOpen() { opened++; }, disabled: false };
  const view = () => nodes(h.render(() => View(props)));
  const action = () => view().find(node => node.type === "Button")!;
  assert.ok(action(), "shortcut hint must be an accessible inline action for touch users");
  assert.equal(action().props["aria-label"], "Выполнить QL-запрос");
  invoke(action(), "onPress"); assert.equal(opened, 1);
  props.disabled = true;
  assert.equal(action().props.isDisabled, true);
  assert.equal(action().props.onPress, undefined);
});

test("repository filters stay inside their owning dialog and above the drawer surface", () => {
  const h = componentHarness();
  const { RepositoryQueryControls: View } = h.load<{ RepositoryQueryControls: typeof RepositoryQueryControls }>(
    new URL("../../../cases/browser/controls/RepositoryQueryControls.tsx", import.meta.url), name => {
      if (name.endsWith("case-field-filters")) return { fieldFilterCount: () => 0 };
    });
  const props = { locale: "en", query: "", qlQuery: "", directory: { items: [] }, tags: [], filterOpen: true,
    filters: { type: "all", priority: "all", lifecycle: "all", tag: "", includeArchived: false },
    facets: { folders: [], components: [] }, options: { folders: [], components: [] } } as unknown as Parameters<typeof View>[0];
  const view = () => nodes(h.render(() => View(props)));
  const dialog = { role: "dialog" };
  const root = view().find(node => node.props["data-repository-controls"] === true)!;
  assert.equal(typeof root.props.ref, "function", "filter controls must resolve their owning dialog");
  invoke(root, "ref", { closest: () => dialog });
  const popover = view().find(node => node.type === "Popover")!;
  assert.equal(popover.props.portalContainer, dialog);
  assert.equal((popover.props.style as { zIndex: number }).zIndex, 180);
  assert.equal(view().find(node => node.type === "CaseFilterMenu")?.props.overlayLayer, 181);
});
