import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";

function load(path: string, environment: string) {
  const module = { exports: {} as Record<string, (...args: unknown[]) => unknown> };
  let imports = 0, notFound = 0;
  const code = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  runInNewContext(code, { module, exports: module.exports, process: { env: { NODE_ENV: environment } },
    require: (name: string) => {
      if (name === "react/jsx-runtime") return jsxRuntime;
      if (name === "next/dynamic") return { __esModule: true, default: (_loader: () => unknown, options: { ssr: boolean }) => {
        assert.equal(options.ssr, false); return () => { imports++; return null; };
      } };
      if (name === "next/navigation") return { notFound: () => { notFound++; throw new Error("NEXT_NOT_FOUND"); } };
      return new Proxy({}, { get: () => () => null });
    },
  });
  return { exports: module.exports, counts: () => ({ imports, notFound }) };
}

test("production route throws 404 before rendering any browser preview", () => {
  const path = "app/(falcon)/work/integration-preview/page.tsx";
  const production = load(path, "production");
  assert.throws(() => production.exports.default(), /NEXT_NOT_FOUND/);
  assert.deepEqual(production.counts(), { imports: 0, notFound: 1 });
  const development = load(path, "development");
  assert.ok(development.exports.default());
  assert.deepEqual(development.counts(), { imports: 0, notFound: 0 });
});

test("production wrapper returns null without reading window or rendering the scene", () => {
  const production = load("app/src/modules/core-tms/development-preview/integrations/IntegrationSettingsPreview.tsx", "production");
  assert.equal(production.exports.IntegrationSettingsPreview(), null);
});
