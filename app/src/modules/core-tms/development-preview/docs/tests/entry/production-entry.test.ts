import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";

test("the production Docs QA route returns404 before importing or rendering any fixture", () => {
  const path = "app/(falcon)/work/docs-reading-preview/page.tsx";
  const code = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  for (const environment of ["production", "development"]) {
    const module = { exports: {} as { default(): unknown } }; let imports = 0, notFound = 0;
    runInNewContext(code, { module, exports: module.exports, process: { env: { NODE_ENV: environment } },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return jsxRuntime;
        if (name === "next/dynamic") return { __esModule: true, default: (loader: () => unknown, options: { ssr: boolean }) => {
          assert.equal(options.ssr, false); void loader; return () => { imports++; return null; };
        } };
        if (name === "next/navigation") return { notFound: () => { notFound++; throw new Error("NEXT_NOT_FOUND"); } };
        throw new Error(`Unexpected route import ${name}`);
      },
    });
    if (environment === "production") assert.throws(() => module.exports.default(), /NEXT_NOT_FOUND/);
    else assert.ok(module.exports.default());
    assert.equal(imports, 0); assert.equal(notFound, environment === "production" ? 1 : 0);
  }
});
