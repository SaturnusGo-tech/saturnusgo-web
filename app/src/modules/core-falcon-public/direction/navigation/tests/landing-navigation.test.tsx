import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../../core-tms/portfolios/tests/support/component-harness";

function setup(href: string, reducedMotion = false) {
  const location = { href };
  const scrolls: { top: number; behavior: string }[] = [];
  let focused = false;
  const history = {
    state: { retained: true },
    replaceState(_state: unknown, _title: string, url: URL) { location.href = url.href; },
    pushState(_state: unknown, _title: string, url: URL) { location.href = url.href; },
  };
  const h = componentHarness(href, {
    location, history,
    matchMedia: () => ({ matches: reducedMotion }),
    document: { getElementById: () => ({
      getBoundingClientRect: () => ({ top: 500 }),
      querySelector: () => ({ focus: () => { focused = true; } }),
    }) },
  });
  Object.assign(h.window, { scrollY: 100, scrollTo: (options: typeof scrolls[number]) => scrolls.push(options) });
  const { useLandingNavigation } = h.load<{ useLandingNavigation: () => () => void }>(
    new URL("../useLandingNavigation.ts", import.meta.url),
  );
  const openContact = h.render(useLandingNavigation);
  return { h, location, history, scrolls, openContact, focused: () => focused };
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
    assert.equal(state.location.href, `https://tms.saturnusgo.com${pathname}#book-demo`);
    state.h.dispose();
  }
});

test("contact navigation stays on the landing and focuses its form with reduced-motion support", () => {
  for (const reduced of [false, true]) {
    const state = setup("https://tms.saturnusgo.com/ru/?utm_source=mail", reduced);
    state.openContact();
    assert.equal(state.location.href, "https://tms.saturnusgo.com/ru/?utm_source=mail#book-demo");
    assert.equal(state.scrolls[0].top, 576);
    assert.equal(state.scrolls[0].behavior, reduced ? "instant" : "smooth");
    assert.equal(state.focused(), true);
    state.h.dispose();
  }
});

test("current product links are unchanged", () => {
  const href = "https://tms.saturnusgo.com/ru/?utm_source=mail#repository";
  const state = setup(href);
  assert.equal(state.location.href, href);
  state.h.dispose();
});
