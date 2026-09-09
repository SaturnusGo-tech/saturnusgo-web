import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../tests/support/component-harness";
import type { usePortfolioTab } from "./usePortfolioTab";

const base = "https://tms.example/work/?workspaceId=w&view=portfolios&portfolioId=p";
function setup(href = base) {
  const h = componentHarness(href);
  const hook = h.load<{ usePortfolioTab: typeof usePortfolioTab }>(new URL("./usePortfolioTab.ts", import.meta.url), () => ({
    HISTORY_CHANGE: "falcon:navigation", navigateWorkspace: h.navigate,
  })).usePortfolioTab;
  return { ...h, read: (id = "p") => h.render(() => hook(id)) };
}
test("Projects survives entering a project and returning Back or reloading the portfolio", () => {
  const h = setup();
  assert.equal(h.read().tab, "about");
  h.read().select("projects");
  const selectedHref = h.window.location.href;
  assert.equal(new URL(selectedHref).searchParams.get("portfolioTab"), "projects");
  h.dispose();
  const back = setup(selectedHref);
  assert.equal(back.read().tab, "projects");
  back.navigate(base); back.emit("popstate");
  assert.equal(back.read().tab, "about");
  back.navigate(selectedHref); back.emit("popstate");
  assert.equal(back.read().tab, "projects");
});
test("tab state is scoped to the portfolio and responds to application navigation", () => {
  const h = setup(`${base}&portfolioTab=projects`); h.read();
  h.navigate(base); h.emit("falcon:navigation"); assert.equal(h.read().tab, "about");
  h.navigate(`${base.replace("portfolioId=p", "portfolioId=other")}&portfolioTab=projects`);
  h.emit("popstate"); assert.equal(h.read().tab, "about");
  const before = h.window.location.href; h.read().select("about"); assert.equal(h.window.location.href, before);
  const unrelated = setup(`${base}&portfolioTab=invalid`); assert.equal(unrelated.read().tab, "about");
});
