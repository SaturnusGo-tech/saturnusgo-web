import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { componentHarness } from "../../../portfolios/tests/support/component-harness";
import type { usePortfolioRepository } from "../../state/usePortfolioRepository";
import type { PortfolioCatalog, RepositoryProject } from "../../data/repository-content";

test("switching portfolios cancels old work and ignores late catalog, cases and failure callbacks", async () => {
  const h = componentHarness(); const http = {};
  const requests: { id: string; signal: AbortSignal; catalog: (value: PortfolioCatalog) => void;
    project: (id: string, value: RepositoryProject | null) => void; resolve: () => void; reject: (reason: Error) => void }[] = [];
  const hook = h.load<{ usePortfolioRepository: typeof usePortfolioRepository }>(new URL("../../state/usePortfolioRepository.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
    if (name.endsWith("repository-content")) return { loadPortfolioRepository: (_http: unknown, _workspace: string, id: string, signal: AbortSignal,
      catalog: (value: PortfolioCatalog) => void, project: (id: string, value: RepositoryProject | null) => void) => new Promise<void>((resolve, reject) => requests.push({ id, signal, catalog, project, resolve, reject })) };
  }).usePortfolioRepository;
  const render = (id: string) => h.render(() => hook("workspace", id, true));
  render("first"); render("second");
  assert.equal(requests[0].signal.aborted, true);
  const catalog = (id: string) => ({ portfolio: { id }, projects: [] }) as unknown as PortfolioCatalog;
  requests[1].catalog(catalog("second")); requests[1].project("project2", { cases: [], folders: [] }); requests[1].resolve();
  requests[0].catalog(catalog("first")); requests[0].project("project1", { cases: [], folders: [] }); requests[0].reject(new Error("late"));
  await setImmediate();
  const current = render("second");
  assert.equal(current.catalog?.portfolio.id, "second"); assert.equal(current.error, false);
  assert.equal(current.branches.has("project1"), false); assert.equal(current.branches.has("project2"), true);
  h.dispose();
});

test("restored or new workspace scopes do not display the previous workspace's portfolio", () => {
  const h = componentHarness(); const http = {};
  const hook = h.load<{ usePortfolioRepository: typeof usePortfolioRepository }>(new URL("../../state/usePortfolioRepository.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => http };
    if (name.endsWith("repository-content")) return { loadPortfolioRepository: async (_http: unknown, _workspace: string, id: string, _signal: AbortSignal, onCatalog: (value: unknown) => void) => onCatalog({ portfolio: { id }, projects: [] }) };
  }).usePortfolioRepository;
  h.render(() => hook("first", "portfolio", true));
  assert.ok(h.render(() => hook("first", "portfolio", true)).catalog);
  assert.equal(h.render(() => hook("second", "portfolio", true)).catalog, null);
  h.dispose();
});
