import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
export type Node = { type: string; props: Record<string, unknown> };
export function componentHarness(initialHref = "https://tms.example/work/") {
  let cursor = 0;
  let effects: (() => void)[] = [];
  const slots: Slot[] = [];
  const listeners = new Map<string, Set<() => void>>();
  const window = { location: { href: initialHref },
    addEventListener(name: string, callback: () => void) { const set = listeners.get(name) ?? new Set(); set.add(callback); listeners.set(name, set); },
    removeEventListener(name: string, callback: () => void) { listeners.get(name)?.delete(callback); },
  };
  const same = (a?: readonly unknown[], b?: readonly unknown[]) => Boolean(a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index])));
  const react = {
    useId() { const index = cursor++; slots[index] ??= { value: `test-id-${index}` }; return slots[index].value; },
    createContext<T>(value: T) { return { value, Provider: "ContextProvider" }; },
    useContext<T>(context: { value: T }) { return context.value; },
    useState<T>(initial: T | (() => T)) {
      const index = cursor++;
      slots[index] ??= { value: typeof initial === "function" ? (initial as () => T)() : initial };
      return [slots[index].value, (value: T | ((current: T) => T)) => {
        slots[index].value = typeof value === "function" ? (value as (current: T) => T)(slots[index].value as T) : value;
      }];
    },
    useCallback<T>(callback: T) { return callback; },
    useRef<T>(initial: T) { const index = cursor++; slots[index] ??= { value: { current: initial } }; return slots[index].value; },
    useEffect(fn: () => void | (() => void), deps: readonly unknown[]) {
      const index = cursor++;
      if (same(slots[index]?.deps, deps)) return;
      effects.push(() => { slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: fn() || undefined }; });
    },
  };
  const proxy = new Proxy({}, { get: (_target, key) => String(key) });
  function load<T>(url: URL, resolve: (name: string) => unknown = () => undefined): T {
    const module = { exports: {} };
    const jsx = (type: string, props: Record<string, unknown>) => ({ type, props });
    runInNewContext(ts.transpileModule(readFileSync(url, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, { module, exports: module.exports, AbortController, JSON, URL, window, crypto: globalThis.crypto,
      require: (name: string) => name === "react" ? react : name === "react/jsx-runtime" ? { jsx, jsxs: jsx }
        : name.endsWith("content-transition") ? { transitionContent: (update: () => void) => update() }
        : name.endsWith(".css") ? { default: proxy } : resolve(name) ?? proxy });
    return module.exports as T;
  }
  function render<T>(hook: () => T) { cursor = 0; effects = []; const result = hook(); effects.forEach((fn) => fn()); return result; }
  return { load, render, window, navigate: (href: string) => { window.location.href = href; },
    emit: (name: string) => listeners.get(name)?.forEach((callback) => callback()),
    dispose: () => slots.forEach((slot) => slot.cleanup?.()) };
}
export function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}
export function invoke(node: Node, event: string, argument?: unknown): unknown { return (node.props[event] as (arg?: unknown) => unknown)(argument); }
