import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../../core-tms/portfolios/tests/support/component-harness";

function setup(href: string) {
  const location = { href };
  const scrolls: string[] = [];
  const history = {
    state: { retained: true },
    replaceState(state: { retained: boolean }, _title: string, url: URL) {
      this.state = state;
      location.href = url.href;
    },
  };
  const h = componentHarness(href, {
    location,
    history,
    document: {
      getElementById: (id: string) => id === "resources" ? { scrollIntoView: () => scrolls.push(id) } : null,
    },
  });
  const { useLandingNavigation } = h.load<{ useLandingNavigation: () => void }>(
    new URL("../useLandingNavigation.ts", import.meta.url),
  );
  h.render(useLandingNavigation);
  return { h, location, history, scrolls };
}

test("retired video URLs open the primary landing in either language without losing attribution", () => {
  for (const pathname of ["/", "/ru/"]) {
    const state = setup(`https://tms.saturnusgo.com${pathname}?view=workflow&utm_source=mail#cases-video`);
    assert.equal(state.location.href, `https://tms.saturnusgo.com${pathname}?utm_source=mail`);
    assert.deepEqual(state.history.state, { retained: true });
    assert.equal(state.scrolls.length, 0);
    state.location.href = `https://tms.saturnusgo.com${pathname}?view=workflow#product`;
    state.h.emit("popstate");
    assert.equal(state.location.href, `https://tms.saturnusgo.com${pathname}`);
    state.location.href = `https://tms.saturnusgo.com${pathname}?view=workflow#book-demo`;
    state.h.emit("popstate");
    assert.equal(state.location.href, `https://tms.saturnusgo.com${pathname}#resources`);
    assert.deepEqual(state.scrolls, ["resources"]);
    state.h.dispose();
  }
});

test("retired demo bookmarks scroll to resources without losing attribution", () => {
  for (const pathname of ["/", "/ru/"]) {
    const state = setup(`https://tms.saturnusgo.com${pathname}?utm_source=mail#book-demo`);
    assert.equal(state.location.href, `https://tms.saturnusgo.com${pathname}?utm_source=mail#resources`);
    assert.deepEqual(state.history.state, { retained: true });
    assert.deepEqual(state.scrolls, ["resources"]);
    state.h.dispose();
  }
});

test("current product links are unchanged", () => {
  const href = "https://tms.saturnusgo.com/ru/?utm_source=mail#repository";
  const state = setup(href);
  assert.equal(state.location.href, href);
  state.h.dispose();
});
