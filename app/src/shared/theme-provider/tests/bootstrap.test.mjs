import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";

const layout = readFileSync(new URL("../../../../layout.tsx", import.meta.url), "utf8");
const bootstrap = layout.match(/id="sg-theme-init"[^>]*>\{`([\s\S]*?)`\}<\/Script>/)?.[1];
assert.ok(bootstrap, "The early document theme bootstrap must be executable before hydration");

function loadTheme(stored, { osDark = false, blocked = false } = {}) {
  const classes = new Set();
  const saved = new Map(stored === undefined ? [] : [["sg-theme", stored]]);
  const root = { classList: {
    toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); },
    add(...names) { names.forEach(name => classes.add(name)); },
    remove(...names) { names.forEach(name => classes.delete(name)); },
  } };
  runInNewContext(bootstrap, { document: { documentElement: root },
    localStorage: {
      getItem(key) { if (blocked) throw new Error("Storage blocked"); return saved.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error("Storage blocked"); saved.set(key, value); },
      removeItem(key) { if (blocked) throw new Error("Storage blocked"); saved.delete(key); },
    }, window: { matchMedia: () => ({ matches: osDark }) },
  });
  return { dark: classes.has("dark"), saved: saved.get("sg-theme") };
}

test("a first visit starts dark independently of a light or dark operating system", () => {
  assert.equal(loadTheme(undefined, { osDark: false }).dark, true);
  assert.equal(loadTheme(undefined, { osDark: true }).dark, true);
});

test("explicit saved light and dark selections survive a reload", () => {
  assert.deepEqual(loadTheme("light", { osDark: true }), { dark: false, saved: "light" });
  assert.deepEqual(loadTheme("dark", { osDark: false }), { dark: true, saved: "dark" });
});

test("legacy system and invalid saved themes fall back to dark instead of following the OS", () => {
  for (const stored of ["system", "sepia", " "]) {
    const state = loadTheme(stored, { osDark: false });
    assert.equal(state.dark, true, stored);
    assert.equal(state.saved, "dark", "Hydration must read the normalized preference too");
  }
});

test("unavailable storage still applies the dark default before hydration", () => {
  assert.equal(loadTheme(undefined, { blocked: true }).dark, true);
});
