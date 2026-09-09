import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

type Slot = { value?: unknown; deps?: readonly unknown[]; cleanup?: () => void };
export function hookHarness(initialHref: string) {
  let cursor = 0;
  let dirty = false;
  let effects: (() => void)[] = [];
  const slots: Slot[] = [];
  const listeners = new Map<string, Set<() => void>>();
  const storage = new Map<string, string>();
  const writes: string[] = [];
  const window = { location: { href: initialHref },
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    addEventListener(name: string, callback: () => void) { const set = listeners.get(name) ?? new Set(); set.add(callback); listeners.set(name, set); },
    removeEventListener(name: string, callback: () => void) { listeners.get(name)?.delete(callback); },
    setTimeout: () => 1, clearTimeout() {},
  };
  const same = (a?: readonly unknown[], b?: readonly unknown[]) => Boolean(a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index])));
  const react = {
    useState<T>(initial: T | (() => T)) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === "function" ? (initial as () => T)() : initial };
      return [slots[index].value, (value: T | ((current: T) => T)) => {
        const next = typeof value === "function" ? (value as (current: T) => T)(slots[index].value as T) : value;
        if (!Object.is(next, slots[index].value)) { slots[index].value = next; dirty = true; }
      }];
    },
    useRef<T>(initial: T) { const index = cursor++; slots[index] ??= { value: { current: initial } }; return slots[index].value; },
    useCallback<T>(fn: T, deps: readonly unknown[]) { const index = cursor++; if (!same(slots[index]?.deps, deps)) slots[index] = { value: fn, deps }; return slots[index].value; },
    useEffect(fn: () => void | (() => void), deps: readonly unknown[]) {
      const index = cursor++;
      if (same(slots[index]?.deps, deps)) return;
      effects.push(() => { slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: fn() || undefined }; });
    },
  };
  function load<T>(url: URL, resolve: (name: string) => unknown): T {
    const module = { exports: {} };
    runInNewContext(ts.transpileModule(readFileSync(url, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
    }).outputText, { module, exports: module.exports, window, URL,
      require: (name: string) => name === "react" ? react : resolve(name) });
    return module.exports as T;
  }
  function render<T>(hook: () => T) { cursor = 0; effects = []; dirty = false; const result = hook(); effects.forEach((fn) => fn()); return result; }
  function settle<T>(hook: () => T) { let result = render(hook); for (let index = 0; dirty && index < 12; index++) result = render(hook); if (dirty) throw new Error("Hook did not settle"); return result; }
  return { load, render, settle, react, window, writes, storage,
    emit(name: string) { [...(listeners.get(name) ?? [])].forEach((fn) => fn()); },
    navigate(href: string) { window.location.href = href; writes.push(href); },
    dispose() { slots.forEach((slot) => slot.cleanup?.()); },
  };
}
