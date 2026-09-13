import assert from "node:assert/strict";
import test from "node:test";
import { executeCatalogAction } from "../application/execute-catalog-action";
import type { CatalogAction } from "../model/action";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";

test("catalog lifecycle uses the displayed version and preserves its request across retries", async () => {
  const calls: unknown[][] = [];
  const http = { mutateResource: async (...args: unknown[]) => { calls.push(args); throw new Error("connection lost after commit"); },
    getResource: async () => { throw new Error("must not reread a deleted resource before replay"); } } as unknown as TmsHttpClient;
  const signal = new AbortController().signal;
  const target = { kind: "portfolio", item: { id: "p", rowVersion: 7 }, action: "remove" } as CatalogAction;
  await assert.rejects(executeCatalogAction(http, target, "stable-receipt", signal));
  await assert.rejects(executeCatalogAction(http, target, "stable-receipt", signal));
  assert.deepEqual(calls[0], calls[1]);
  assert.equal(calls[0][0], "/portfolios/p/remove");
  assert.equal((calls[0][3] as { ifMatch: string }).ifMatch, '"portfolio:p:7"');
});
test("removing a project from a portfolio only clears its association with a versioned PATCH", async () => {
  const calls: unknown[][] = [];
  const http = { mutateResource: async (...args: unknown[]) => { calls.push(args); throw new Error("stop after request"); } } as unknown as TmsHttpClient;
  const target = { kind: "project", item: { id: "project", rowVersion: 4, portfolioId: "p" }, action: "detach" } as CatalogAction;
  await assert.rejects(executeCatalogAction(http, target, "detach-receipt", new AbortController().signal));
  assert.equal(calls[0][0], "/projects/project"); assert.equal(calls[0][1], "PATCH");
  assert.deepEqual(calls[0][2], { portfolioId: null });
  assert.equal((calls[0][3] as { ifMatch: string }).ifMatch, '"project:project:4"');
});
