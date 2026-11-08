import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

type Effect = () => void | (() => void);
type Slot = { value?: any; deps?: readonly unknown[]; setup?: Effect; cleanup?: void | (() => void) };
type Node = { type: string; props: Record<string, any> };
const source = readFileSync(new URL("../CustomFieldPicker.tsx", import.meta.url), "utf8");

// Rehearse StrictMode's whole mount pass: all setups, all cleanups, all setups.
// Repeating each effect independently would miss the context-close/auto-open race.
function pickerHarness(disabled = false) {
  let cursor = 0; let mounting = true;
  const slots: Slot[] = []; const pending: Slot[] = [];
  const same = (a?: readonly unknown[], b?: readonly unknown[]) => Boolean(a && b
    && a.length === b.length && a.every((value, index) => Object.is(value, b[index])));
  const react = {
    useState(initial: any) {
      const index = cursor++; slots[index] ??= { value: typeof initial === "function" ? initial() : initial };
      return [slots[index].value, (next: any) => { slots[index].value = typeof next === "function" ? next(slots[index].value) : next; }];
    },
    useRef(current: any) { const index = cursor++; slots[index] ??= { value: { current } }; return slots[index].value; },
    useId() { cursor++; return "custom-field"; },
    useCallback(callback: any, deps: readonly unknown[]) {
      const index = cursor++; if (!same(slots[index]?.deps, deps)) slots[index] = { value: callback, deps };
      return slots[index].value;
    },
    useEffect(setup: Effect, deps: readonly unknown[]) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) {
        const slot = { setup, deps, cleanup: slots[index]?.cleanup }; slots[index] = slot; pending.push(slot);
      }
    },
  };
  const module = { exports: {} as { CustomFieldPicker: (props: unknown) => Node } };
  const jsx = (type: string, props: Node["props"]) => ({ type, props });
  runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { module, exports: module.exports, require(name: string) {
    if (name === "react") return react;
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    if (name.endsWith(".css")) return { default: new Proxy({}, { get: (_target, key) => String(key) }) };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("PropertySelect")) return { PropertyPopover: "PropertyPopover", PropertySearch: "PropertySearch" };
    if (name.endsWith("useCustomFieldValues")) return { useCustomFieldValues: () => ({ search: "", items: [], loading: false, setSearch() {} }) };
    if (name.endsWith("useFieldValueWrite")) return { useFieldValueWrite: () => ({ reset() {} }) };
    if (name.endsWith("field-labels")) return { customFieldLabel: () => "Regression" };
    if (name.endsWith("field-validation")) return { parseFieldValue: () => null };
    return new Proxy({}, { get: () => () => null });
  } });
  let props = { field: { id: "regression", name: "Regression" }, selected: [], workspaceId: "workspace",
    projectId: "project", autoOpen: true, disabled, parentValueId: undefined as string | undefined, onChange() {} };
  function render() {
    cursor = 0; pending.length = 0;
    const tree = module.exports.CustomFieldPicker(props);
    for (const slot of pending) { slot.cleanup?.(); slot.cleanup = slot.setup?.(); }
    if (mounting) {
      mounting = false;
      for (const slot of pending) slot.cleanup?.();
      for (const slot of pending) slot.cleanup = slot.setup?.();
    }
    assert.equal(tree.type, "PropertyPopover");
    return tree;
  }
  return { render, update: (patch: Partial<typeof props>) => { props = { ...props, ...patch }; } };
}

test("auto-open survives the StrictMode context-effect mount rehearsal", () => {
  const picker = pickerHarness(); picker.render();
  assert.equal(picker.render().props.open, true);
});

test("manual close and a parent-context change do not reopen an inline picker", () => {
  const picker = pickerHarness(); picker.render();
  picker.render().props.onOpenChange(false);
  assert.equal(picker.render().props.open, false);
  picker.update({ parentValueId: "other-group" }); picker.render();
  assert.equal(picker.render().props.open, false);
});

test("a disabled inline picker opens when it first becomes enabled", () => {
  const picker = pickerHarness(true); picker.render();
  assert.equal(picker.render().props.open, false);
  picker.update({ disabled: false }); picker.render();
  assert.equal(picker.render().props.open, true);
});
