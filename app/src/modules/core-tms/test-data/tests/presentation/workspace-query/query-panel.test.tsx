import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { after, before, test } from "node:test";
import React from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url), previous = Object.getOwnPropertyDescriptor(globalThis, "React");
let Panel: typeof import("../../../presentation/workspace-query/SqlQueryPanel")["SqlQueryPanel"];
before(() => { Object.assign(globalThis, { React }); const restore = installRenderControls(); try { Panel = require("../../../presentation/workspace-query/SqlQueryPanel").SqlQueryPanel; } finally { restore(); } });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
const text = (node: ReactTestInstance): string => node.children.map(child => typeof child === "string" ? child : text(child)).join("");
const pause = () => new Promise(resolve => setTimeout(resolve, 10));
test("query results originate from the scoped API and pagination retains executed SQL", async () => {
  const calls: unknown[] = [], context = { permissions: { read: true }, workspace: { query: async (value: unknown) => { calls.push(value); return { columns: [{ name: "name", type: "String" }], rows: [{ name: "Avery" }], rowCount: 1, hasMore: true, offset: 0, limit: 50, truncated: false, durationMs: 9 }; } } } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={context}><Panel sourceIds={["source-a"]} query={'SELECT * FROM "customers"'} onChange={() => {}} ru={false} /></TestDataProvider>); await pause(); });
  assert.equal(calls.length, 0);
  await act(async () => { view!.root.findAllByType("button").find(button => text(button) === "Run")!.props.onPress(); await pause(); });
  assert.deepEqual(calls[0], { sourceIds: ["source-a"], sql: 'SELECT * FROM "customers"', limit: 50, offset: 0 });
  assert.ok(text(view!.root).includes("Avery"));
  await act(async () => { view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Next page")!.props.onPress(); await pause(); });
  assert.deepEqual(calls[1], { sourceIds: ["source-a"], sql: 'SELECT * FROM "customers"', limit: 50, offset: 50 });
  await act(async () => view!.unmount());
});
test("navigation cancels the old query and ignores its response while loading the new source SQL", async () => {
  const pending: { sql: string; signal: AbortSignal; resolve(value: unknown): void }[] = [];
  const context = { permissions: { read: true }, workspace: { query: (value: { sql: string }, signal: AbortSignal) => new Promise(resolve => pending.push({ sql: value.sql, signal, resolve })) } } as unknown as TestDataContextValue;
  const render = (source: string, sql: string) => <TestDataProvider value={context}><Panel sourceIds={[source]} query={sql} onChange={() => {}} ru={false} autoRun /></TestDataProvider>;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(render("source-a", "SELECT a")); await pause(); });
  await act(async () => { view!.update(render("source-b", "SELECT b")); await pause(); });
  assert.equal(pending[0].signal.aborted, true); assert.equal(pending[1].sql, "SELECT b");
  const result = (name: string) => ({ columns: [{ name: "name", type: "String" }], rows: [{ name }], rowCount: 1, hasMore: false, offset: 0, limit: 50, truncated: false, durationMs: 1 });
  await act(async () => { pending[1].resolve(result("Current result")); pending[0].resolve(result("Stale result")); await pause(); });
  assert.match(text(view!.root), /Current result/); assert.doesNotMatch(text(view!.root), /Stale result/);
  await act(async () => view!.unmount());
});
test("read-denied panes never auto query a source", async () => {
  let calls = 0; const context = { permissions: { read: false }, workspace: { query: async () => { calls++; } } } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={context}><Panel sourceIds={["s"]} query="SELECT a" onChange={() => {}} ru={false} autoRun /></TestDataProvider>); await pause(); });
  assert.equal(calls, 0); await act(async () => view!.unmount());
});
test("refresh keeps the last table mounted, including its search and pagination, through pending and failure", async () => {
  const requests: { resolve(value: unknown): void; reject(error: unknown): void }[] = [];
  const context = { permissions: { read: true }, workspace: { query: () => new Promise((resolve, reject) => requests.push({ resolve, reject })) } } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={context}><Panel sourceIds={["s"]} query="SELECT name" onChange={() => {}} ru={false} autoRun /></TestDataProvider>); await pause(); });
  await act(async () => { requests[0].resolve({ columns: [{ name: "name", type: "String" }], rows: [{ name: "Alice" }, { name: "Bob" }], rowCount: 2, hasMore: true, offset: 0, limit: 50, truncated: false }); await pause(); });
  await act(async () => view!.root.findByType("input").props.onValueChange("Alice"));
  const table = view!.root.findByType("table"), footer = view!.root.findByType("footer");
  await act(async () => { view!.root.findAllByType("button").find(button => text(button) === "Run")!.props.onPress(); await pause(); });
  assert.equal(view!.root.findAllByType("table")[0], table, "query refresh must not replace the results with a loading skeleton");
  assert.equal(view!.root.findByType("footer"), footer);
  assert.equal(view!.root.findByType("input").props.value, "Alice");
  assert.match(text(view!.root), /Alice/); assert.doesNotMatch(text(view!.root), /Bob/);
  await act(async () => { requests[1].reject({ code: "QUERY_FAILED" }); await pause(); });
  assert.equal(view!.root.findByType("table"), table);
  assert.equal(view!.root.findByType("input").props.value, "Alice");
  assert.match(text(view!.root), /Alice/);
  assert.ok(view!.root.findAllByProps({ role: "alert" }).length > 0);
  await act(async () => { view!.root.findAllByType("button").find(button => text(button) === "Retry")!.props.onPress(); await pause(); });
  await act(async () => { requests[2].resolve({ columns: [{ name: "name", type: "String" }], rows: [{ name: "Alice updated" }, { name: "Bob new" }], rowCount: 2, hasMore: false, offset: 0, limit: 50, truncated: false }); await pause(); });
  assert.equal(view!.root.findByType("table"), table);
  assert.equal(view!.root.findByType("input").props.value, "Alice");
  assert.match(text(view!.root), /Alice updated/); assert.doesNotMatch(text(view!.root), /Bob new/);
  assert.equal(view!.root.findAllByProps({ role: "alert" }).length, 0);
  await act(async () => view!.unmount());
});
test("source tables hide the SQL editor and refresh without losing their visible rows", async () => {
  let calls = 0; const context = { permissions: { read: true }, workspace: { query: async () => { calls++; return { columns: [{ name: "name", type: "String" }], rows: [{ name: "Avery" }], hasMore: false, truncated: false, durationMs: 9 }; } } } as unknown as TestDataContextValue;
  const render = (refreshKey: number) => <TestDataProvider value={context}><Panel sourceIds={["s"]} query="SELECT name" onChange={() => {}} ru={false} autoRun showEditor={false} refreshKey={refreshKey} /></TestDataProvider>;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(render(0)); await pause(); });
  assert.equal(calls, 1); assert.match(text(view!.root), /Avery/); assert.doesNotMatch(text(view!.root), /9 ms/);
  assert.equal(view!.root.findAllByProps({ "aria-label": "SQL query" }).length, 0, "the source table has no SQL editor");
  assert.equal(view!.root.findByType("input").props.placeholder, "Search table");
  await act(async () => { view!.update(render(1)); await pause(); });
  assert.equal(calls, 2); assert.match(text(view!.root), /Avery/);
  await act(async () => view!.unmount());
});
test("retry repeats the failed page instead of the last successfully displayed page", async () => {
  const calls: { sql: string; offset: number }[] = [];
  const context = { permissions: { read: true }, workspace: { query: async (request: { sql: string; offset: number }) => {
    calls.push(request);
    if (calls.length === 2) throw { code: "QUERY_FAILED" };
    return { columns: [], rows: [], hasMore: true, offset: request.offset, limit: 50, truncated: false };
  } } } as unknown as TestDataContextValue;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(<TestDataProvider value={context}><Panel sourceIds={["s"]} query="SELECT name" onChange={() => {}} ru={false} autoRun /></TestDataProvider>); await pause(); });
  await act(async () => { view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Next page")!.props.onPress(); await pause(); });
  await act(async () => { view!.root.findAllByType("button").find(button => text(button) === "Retry")!.props.onPress(); await pause(); });
  assert.deepEqual(calls.map(request => request.offset), [0, 50, 50]);
  await act(async () => view!.unmount());
});
test("retry of a new SQL query starts at its attempted first page", async () => {
  const calls: { sql: string; offset: number }[] = [];
  const context = { permissions: { read: true }, workspace: { query: async (request: { sql: string; offset: number }) => {
    calls.push(request);
    if (calls.length === 3) throw { code: "QUERY_FAILED" };
    return { columns: [], rows: [], hasMore: true, offset: request.offset, limit: 50, truncated: false };
  } } } as unknown as TestDataContextValue;
  const render = (sql: string) => <TestDataProvider value={context}><Panel sourceIds={["s"]} query={sql} onChange={() => {}} ru={false} autoRun /></TestDataProvider>;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(render("SELECT name")); await pause(); });
  await act(async () => { view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Next page")!.props.onPress(); await pause(); });
  await act(async () => { view!.update(render("SELECT email")); await pause(); });
  await act(async () => { view!.root.findAllByType("button").find(button => text(button) === "Run")!.props.onPress(); await pause(); });
  await act(async () => { view!.root.findAllByType("button").find(button => text(button) === "Retry")!.props.onPress(); await pause(); });
  assert.deepEqual(calls.map(({ sql, offset }) => ({ sql, offset })), [
    { sql: "SELECT name", offset: 0 }, { sql: "SELECT name", offset: 50 },
    { sql: "SELECT email", offset: 0 }, { sql: "SELECT email", offset: 0 },
  ]);
  await act(async () => view!.unmount());
});
test("retained results paginate their successful SQL after a different query and retry fail", async () => {
  const calls: { sql: string; offset: number }[] = [];
  const context = { permissions: { read: true }, workspace: { query: async (request: { sql: string; offset: number }) => {
    calls.push(request);
    if (request.sql === "SELECT email") throw { code: "QUERY_FAILED" };
    return { columns: [{ name: "name", type: "String" }], rows: [{ name: `Customer ${request.offset}` }], rowCount: 1, hasMore: true, offset: request.offset, limit: 50, truncated: false };
  } } } as unknown as TestDataContextValue;
  const render = (sql: string) => <TestDataProvider value={context}><Panel sourceIds={["s"]} query={sql} onChange={() => {}} ru={false} autoRun /></TestDataProvider>;
  let view: ReturnType<typeof create>;
  await act(async () => { view = create(render("SELECT name")); await pause(); });
  await act(async () => { view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Next page")!.props.onPress(); await pause(); });
  await act(async () => { view!.update(render("SELECT email")); await pause(); });
  await act(async () => { view!.root.findAllByType("button").find(button => text(button) === "Run")!.props.onPress(); await pause(); });
  await act(async () => { view!.root.findAllByType("button").find(button => text(button) === "Retry")!.props.onPress(); await pause(); });
  assert.match(text(view!.root), /Customer 50/);
  await act(async () => { view!.root.findAllByType("button").find(button => button.props["aria-label"] === "Next page")!.props.onPress(); await pause(); });
  assert.deepEqual(calls.map(({ sql, offset }) => ({ sql, offset })), [
    { sql: "SELECT name", offset: 0 }, { sql: "SELECT name", offset: 50 },
    { sql: "SELECT email", offset: 0 }, { sql: "SELECT email", offset: 0 },
    { sql: "SELECT name", offset: 100 },
  ]);
  assert.match(text(view!.root), /Customer 100/);
  await act(async () => view!.unmount());
});
