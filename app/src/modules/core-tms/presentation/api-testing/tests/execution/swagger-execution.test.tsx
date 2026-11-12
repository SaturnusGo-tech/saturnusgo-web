import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { once } from "node:events";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import ts from "typescript";
import type SwaggerDocument from "../../renderer/SwaggerDocument";
import { apiServers, documentForServer, requireSelectedServer } from "../../../../api-sources/execution/api-servers";
import { authorizeSwaggerRequest } from "../../renderer/swagger-request-policy";
import { filterApiOperations } from "../../model";
import { componentHarness, invoke, nodes, type Node } from "../../../../portfolios/tests/support/component-harness";

const sourceUrl = "https://docs.example.org/openapi.json";
const specification: Parameters<typeof SwaggerDocument>[0]["specification"] = {
  title: "Orders", version: "1", format: "openapi3", operationCount: 1, connectionVersion: 1,
  fetchedAt: "2026-11-12T00:00:00Z", document: {
  openapi: "3.0.3", info: { title: "Orders", version: "1" }, servers: [{ url: "https://api.example.org/v1" }],
  paths: { "/orders/{id}": { get: { operationId: "getOrder", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Order" } } } } },
  components: { securitySchemes: { token: { type: "http", scheme: "bearer" } } }, security: [{ token: [] }],
} };

function fixture(ru = false) {
  const h = componentHarness("https://tms.saturnusgo.com/work/");
  Object.assign(h.window.location, { origin: "https://tms.saturnusgo.com" });
  const { default: View } = h.load<{ default: typeof SwaggerDocument }>(new URL("../../renderer/SwaggerDocument.tsx", import.meta.url), name => {
    if (name === "swagger-ui-react") return { default: "SwaggerUI" };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: ru ? "ru" : "en" }) };
    if (name.endsWith("api-servers")) return { apiServers, documentForServer, requireSelectedServer };
    if (name.endsWith("swagger-request-policy")) return { authorizeSwaggerRequest };
    if (name === "../model") return { filterApiOperations };
    if (name.endsWith("useDisclosureMotion")) return { useDisclosureMotion: () => ({ present: false, ref: {} }) };
  });
  function render(props = { specification, sourceUrl }) {
    return h.render(() => {
      const view = View(props) as unknown as Node;
      return nodes(typeof view.type === "function" ? (view.type as (props: Node["props"]) => unknown)(view.props) : view);
    });
  }
  return { h, View, render };
}

test("Try it out and the request server control are visible before any settings disclosure", () => {
  const f = fixture(), all = f.render();
  assert.ok(all.find(node => node.type === "Select" && node.props["aria-label"] === "Request server"));
  const swagger = all.find(node => node.type === "SwaggerUI")!;
  assert.ok((swagger.props.supportedSubmitMethods as string[]).includes("get"), "native Try it out remains available for editing");
  assert.equal(all.some(node => node.props["aria-controls"] === "api-request-settings"), false);
  assert.equal(swagger.props.persistAuthorization, false);
  assert.equal(swagger.props.withCredentials, false);
  const plugins = swagger.props.plugins as { components: { OnlineValidatorBadge(): null } }[];
  assert.equal(plugins[0].components.OnlineValidatorBadge(), null, "private contracts have no external online-validator badge");
  f.h.dispose();
});

test("execution requires an explicit server, retains API authorization, and never includes Falcon cookies", () => {
  const f = fixture(); let all = f.render();
  let swagger = all.find(node => node.type === "SwaggerUI")!;
  const request = { url: "https://api.example.org/v1/orders/order-42", headers: { Authorization: "Bearer api-only-token" }, credentials: "include" };
  assert.throws(() => invoke(swagger, "requestInterceptor", request), /Select an API server/);
  const server = all.find(node => node.type === "Select")!;
  invoke(server, "onSelectionChange", new Set(["https://api.example.org/v1"]));
  all = f.render(); swagger = all.find(node => node.type === "SwaggerUI")!;
  assert.deepEqual(invoke(swagger, "requestInterceptor", request), { ...request, credentials: "omit" });
  assert.throws(() => invoke(swagger, "requestInterceptor", { url: "https://other.example.org/v1/orders" }), /selected API server/);
  f.h.dispose();
});

test("a changed source or fetched specification resets server choice and unmounts the authorization session", () => {
  let mounts = 0, unmounts = 0;
  function SwaggerStub() { React.useEffect(() => { mounts++; return () => { unmounts++; }; }, []); return <div data-swagger />; }
  const module = { exports: {} };
  const proxy = new Proxy({}, { get: (_target, name) => String(name) });
  runInNewContext(ts.transpileModule(readFileSync(new URL("../../renderer/SwaggerDocument.tsx", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, require: (name: string) => {
    if (name === "react") return React;
    if (name === "react/jsx-runtime") return jsxRuntime;
    if (name === "swagger-ui-react") return { default: SwaggerStub };
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("api-servers")) return { apiServers, documentForServer, requireSelectedServer };
    if (name.endsWith("swagger-request-policy")) return { authorizeSwaggerRequest };
    if (name === "../model") return { filterApiOperations };
    if (name.endsWith(".css")) return { default: proxy };
    return proxy;
  } });
  const View = (module.exports as { default: typeof SwaggerDocument }).default;
  let rendered: ReactTestRenderer;
  act(() => { rendered = create(<View specification={specification} sourceUrl={sourceUrl} />); });
  const control = () => rendered!.root.findByProps({ "aria-label": "Request server" });
  const choose = () => act(() => control().props.onSelectionChange(new Set(["https://api.example.org/v1"])));
  choose();
  assert.deepEqual(Array.from(control().props.selectedKeys), ["https://api.example.org/v1"]);
  act(() => rendered!.update(<View specification={specification} sourceUrl="https://other.example.org/openapi.json" />));
  assert.deepEqual(Array.from(control().props.selectedKeys), []);
  choose();
  act(() => rendered!.update(<View specification={{ ...specification, fetchedAt: "2026-11-12T01:00:00Z" }} sourceUrl="https://other.example.org/openapi.json" />));
  assert.deepEqual(Array.from(control().props.selectedKeys), []);
  assert.equal(mounts, 5); assert.equal(unmounts, 4);
  act(() => rendered!.unmount());
});

test("Swagger's real execution pipeline sends a parameterized authenticated request and displays the fixture response", async () => {
  const received: { method?: string; url?: string; authorization?: string; cookie?: string }[] = [];
  const server = createServer((request, response) => {
    received.push({ method: request.method, url: request.url, authorization: request.headers.authorization, cookie: request.headers.cookie });
    response.setHeader("content-type", "application/json"); response.end(JSON.stringify({ id: "order-42", status: "confirmed" }));
  });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address !== "string");
  const f = fixture(); let all = f.render();
  invoke(all.find(node => node.type === "Select")!, "onSelectionChange", new Set(["https://api.example.org/v1"]));
  all = f.render(); const swagger = all.find(node => node.type === "SwaggerUI")!;
  type Request = { url: string; headers?: Record<string, string>; credentials?: RequestCredentials };
  const SwaggerClient = createRequire(import.meta.url)("swagger-client") as { execute(options: Record<string, unknown>): Promise<{ status: number; body: unknown }> };
  try {
    const response = await SwaggerClient.execute({ spec: swagger.props.spec, operationId: "getOrder", parameters: { id: "order-42" },
      securities: { authorized: { token: { value: "fixture-api-token" } } }, requestInterceptor: swagger.props.requestInterceptor,
      userFetch: (url: string, request: Request) => {
        assert.equal(url, "https://api.example.org/v1/orders/order-42"); assert.equal(request.credentials, "omit");
        // Test-only transport routes the already-validated public HTTPS target to an isolated local fixture.
        return fetch(`http://127.0.0.1:${address.port}${new URL(url).pathname}`, request as RequestInit);
      } });
    assert.equal(response.status, 200); assert.deepEqual(response.body, { id: "order-42", status: "confirmed" });
    assert.deepEqual(received, [{ method: "GET", url: "/v1/orders/order-42", authorization: "Bearer fixture-api-token", cookie: undefined }]);
  } finally { f.h.dispose(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
});

test("Russian request controls describe selection before execution", () => {
  const f = fixture(true), all = f.render();
  assert.ok(all.find(node => node.type === "Select" && node.props["aria-label"] === "Сервер запросов"));
  assert.ok(all.find(node => node.type === "p" && String(node.props.children).includes("Выберите сервер")));
  f.h.dispose();
});
