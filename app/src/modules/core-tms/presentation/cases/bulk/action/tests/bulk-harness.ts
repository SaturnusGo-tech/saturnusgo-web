import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import type { ComponentProps } from "react";
import type { CaseBulkActionBar } from "../CaseBulkActionBar";
import type { BulkActionMenu } from "../BulkActionMenu";

type Element = { type: unknown; props: Record<string, unknown> };
export function elements(node: unknown, match: (element: Element) => boolean): Element[] {
  if (Array.isArray(node)) return node.flatMap((item) => elements(item, match));
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as Element;
  return [...(match(element) ? [element] : []), ...elements(element.props.children, match)];
}
export function harness<T extends object>(file: string, exportName: string, props: T) {
  const slots: unknown[] = [];
  const refs: { current: unknown }[] = [];
  let cursor = 0;
  let effects: (() => void)[] = [];
  const document = { activeElement: null as unknown };
  const module = { exports: {} as Record<string, (props: T) => unknown> };
  const jsx = (type: unknown, itemProps: Record<string, unknown>) => ({ type, props: itemProps });
  runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module, exports: module.exports, document,
    window: { addEventListener() {}, removeEventListener() {} },
    require(name: string) {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "react") return {
        useRef(current: unknown) {
          const index = cursor++;
          if (!(index in slots)) { const ref = { current }; slots[index] = ref; refs.push(ref); }
          return slots[index];
        },
        useState(initial: unknown) {
          const index = cursor++; if (!(index in slots)) slots[index] = initial;
          return [slots[index], (next: unknown) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
        },
        useEffect(action: () => void) { effects.push(action); },
      };
      if (name === "lucide-react" || name === "react-icons/pi") return new Proxy({}, { get: (_, key) => key });
      if (name.endsWith(".css")) return { default: new Proxy({}, { get: (_, key) => key }) };
      if (name === "./BulkActionMenu") return { BulkActionMenu: "BulkActionMenu" };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  function render() { cursor = 0; effects = []; return module.exports[exportName](props); }
  return { props, render, refs, document, flushEffects() { effects.forEach((action) => action()); } };
}
export function bulkHarness(overrides: Partial<ComponentProps<typeof CaseBulkActionBar>> = {}) {
  const calls: string[] = [];
  const props: ComponentProps<typeof CaseBulkActionBar> = {
    locale: "ru", selectedCount: 83, mutationLimit: 1000, mutationEnabled: true,
    onMove: () => calls.push("move"), onRemove: () => calls.push("remove"), onArchive: () => calls.push("archive"),
    onClear: () => calls.push("clear"), onCreateRun: () => calls.push("run"),
    onChangeLifecycle: async (value) => { calls.push(`lifecycle:${value}`); return { ok: true }; },
    onChangePriority: async (value) => { calls.push(`priority:${value}`); return { ok: true }; }, ...overrides,
  };
  const app = harness("../CaseBulkActionBar.tsx", "CaseBulkActionBar", props);
  const menu = (id = "bulk-lifecycle") => elements(app.render(), (element) => element.type === "BulkActionMenu" && element.props.id === id)[0].props as unknown as ComponentProps<typeof BulkActionMenu<string>>;
  return { ...app, calls, menu, buttons: () => elements(app.render(), (element) => element.type === "button") };
}
