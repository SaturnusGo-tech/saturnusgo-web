import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import type { useDashboardAnalytics } from "../useDashboardAnalytics";

type Slot = { value?: unknown; deps?: unknown[]; cleanup?: () => void };
export function hookHarness() {
  const slots: Slot[] = [];
  let cursor = 0;
  let effects: Array<() => void> = [];
  const same = (a?: unknown[], b?: unknown[]) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const memo = (factory: () => unknown, deps: unknown[]) => {
    const slot = slots[cursor++] ??= {};
    if (!same(slot.deps, deps)) { slot.value = factory(); slot.deps = deps; }
    return slot.value;
  };
  const react = {
    useState(initial: unknown) {
      const index = cursor++;
      const slot = slots[index] ??= { value: initial };
      return [slot.value, (value: unknown) => { slot.value = typeof value === "function" ? value(slot.value) : value; }];
    },
    useRef: (value: unknown) => memo(() => ({ current: value }), []),
    useMemo: memo,
    useCallback: (value: unknown, deps: unknown[]) => memo(() => value, deps),
    useEffect(effect: () => (() => void) | undefined, deps: unknown[]) {
      const slot = slots[cursor++] ??= {};
      if (!same(slot.deps, deps)) {
        effects.push(() => { slot.cleanup?.(); slot.cleanup = effect(); });
        slot.deps = deps;
      }
    },
  };
  const module = { exports: {} as { useDashboardAnalytics: typeof useDashboardAnalytics } };
  const compiled = ts.transpileModule(readFileSync(new URL("../useDashboardAnalytics.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText;
  runInNewContext(compiled, { module, exports: module.exports, AbortController,
    require: (name: string) => name === "react" ? react : { createBootstrapDashboardAnalyticsSource: () => { throw new Error("Unexpected bootstrap source"); } },
    console: { error() {} },
  });
  return {
    render(...args: Parameters<typeof useDashboardAnalytics>) {
      cursor = 0;
      const state = module.exports.useDashboardAnalytics(...args);
      const pending = effects; effects = []; pending.forEach((effect) => effect());
      return state;
    },
    unmount() { slots.forEach((slot) => slot.cleanup?.()); },
  };
}
