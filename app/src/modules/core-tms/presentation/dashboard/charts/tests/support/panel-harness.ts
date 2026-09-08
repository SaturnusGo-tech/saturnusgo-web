import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import type { DashboardDrill, DashboardSnapshot } from "../../../../../dashboards/model/dashboard-analytics";

export type PanelNode = { type: string; props: Record<string, any> };
const jsx = (type: any, props: Record<string, any>) => typeof type === "function" ? type(props) : ({ type, props });
export function nodes(value: any): PanelNode[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !value.props) return [];
  return [value, ...nodes(value.props.children)];
}
export function panelHarness(file: string, name: string) {
  const cache = new Map<string, any>();
  function load(path: string): any {
    if (cache.has(path)) return cache.get(path);
    const module = { exports: {} as Record<string, any> };
    cache.set(path, module.exports);
    const compiled = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    runInNewContext(compiled, { module, exports: module.exports, Intl,
      require(request: string) {
        if (request === "react/jsx-runtime") return { jsx, jsxs: jsx, Fragment: "Fragment" };
        if (request === "lucide-react") return new Proxy({}, { get: (_target, key) => String(key) });
        if (request.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en", languageTag: "en-US",
          t: (key: string, values?: Record<string, unknown>) => key + (values ? `:${Object.values(values).join("/")}` : ""),
        }) };
        if (request.endsWith("/labels")) return { localizedLabel: (_locale: string, value: string) => value };
        if (request.endsWith(".css")) return { __esModule: true, default: new Proxy({}, { get: (_target, key) => key }) };
        const absolute = resolve(dirname(path), request);
        return load([`${absolute}.ts`, `${absolute}.tsx`].find(existsSync)!);
      },
    });
    return module.exports;
  }
  const component = load(fileURLToPath(new URL(file, import.meta.url)))[name];
  const drills: DashboardDrill[] = [];
  const open = (drill: DashboardDrill) => drills.push(drill);
  return { drills, render(snapshot: DashboardSnapshot, kind?: string): PanelNode {
    return component({ snapshot, kind, onOpenDrill: open, openDrill: open });
  } };
}
