import assert from "node:assert/strict";
import { test } from "node:test";
import { portfolioCopy } from "../../../../portfolios/model/copy";
import { componentHarness, nodes } from "../../../../portfolios/tests/support/component-harness";
import type { PortfolioName } from "../properties/PortfolioName";
import type { useProjectPortfolioName } from "../../../../projects/state/settings/useProjectPortfolioName";

test("portfolio property resolves the selected name and ignores a previous project's late response", async () => {
  const h = componentHarness();
  const pending: { id: string; signal: AbortSignal; resolve: (value: { data: { name: string } }) => void }[] = [];
  const http = {};
  const hook = h.load<{ useProjectPortfolioName: typeof useProjectPortfolioName }>(new URL("../../../../projects/state/settings/useProjectPortfolioName.ts", import.meta.url), name => {
    if (name.endsWith("TmsHttpClientContext")) return { useOptionalTmsHttpClient: () => http };
    if (name.endsWith("portfolio-api")) return { getPortfolio: (_http: unknown, id: string, signal: AbortSignal) => new Promise(resolve => pending.push({ id, signal, resolve })) };
  });
  const { PortfolioName: render } = h.load<{ PortfolioName: typeof PortfolioName }>(new URL("../properties/PortfolioName.tsx", import.meta.url), name => {
    if (name.endsWith("useProjectPortfolioName")) return hook;
    if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
    if (name.endsWith("portfolios/model/copy")) return { portfolioCopy };
  });
  const draw = (id: string | null, offline = false) => nodes(h.render(() => render({ id, offline })))[0].props.children;
  assert.equal(draw("first"), "Current portfolio");
  assert.equal(draw("second"), "Current portfolio");
  assert.equal(pending[0].signal.aborted, true);
  pending[0].resolve({ data: { name: "Old portfolio" } }); await Promise.resolve();
  assert.equal(draw("second"), "Current portfolio");
  pending[1].resolve({ data: { name: "Payments portfolio" } }); await Promise.resolve();
  assert.equal(draw("second"), "Payments portfolio");
  assert.equal(draw(null), "Without portfolio");
  assert.equal(draw("offline", true), "Current portfolio");
  assert.equal(pending.length, 2);
  h.dispose();
});
