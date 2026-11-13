import { createRequire } from "node:module";
import type { TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";

export function legalBrowser(t: TestContext, href: string, userAgent: string, referrer = "") {
  const require = createRequire(import.meta.url), css = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const keys = ["React", "window", "document", "navigator"];
  const prior = keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const values = new Map<string, string>();
  const sessionStorage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  const browser = Object.assign(new EventTarget(), { location: new URL(href), sessionStorage });
  for (const [key, value] of Object.entries({ React, window: browser, document: { referrer }, navigator: { userAgent } })) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  let view: ReactTestRenderer | null = null;
  t.after(async () => {
    await act(async () => view?.unmount());
    if (css) require.extensions[".css"] = css; else delete require.extensions[".css"];
    for (const [key, descriptor] of prior) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
  });
  return { browser, values, render: async (node: React.ReactElement) => {
    const content = <>{node}</>;
    await act(async () => { if (view) view.update(content); else view = create(content); });
    return view!;
  } };
}
