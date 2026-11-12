import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { readLegalDocument } from "../readLegalDocument";

void test("the privacy page links to the deletion policy in the displayed language and the destination renders that edition", async t => {
  const require = createRequire(import.meta.url);
  const previousCss = require.extensions[".css"];
  require.extensions[".css"] = module => { module.exports = {}; };
  const browser = Object.assign(new EventTarget(), {
    location: new URL("https://tms.saturnusgo.com/privacy/?lang=en"),
  });
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
  Object.assign(globalThis, { React, window: browser });
  let view: ReactTestRenderer | undefined;
  t.after(async () => {
    await act(async () => view?.unmount());
    if (previousCss) require.extensions[".css"] = previousCss;
    else delete require.extensions[".css"];
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (previousReact) Object.defineProperty(globalThis, "React", previousReact);
    else Reflect.deleteProperty(globalThis, "React");
  });

  const { FalconLegalPage } = await import("../FalconLegalPage");
  await act(async () => { view = create(<FalconLegalPage document="privacy" versions={readLegalDocument("privacy")} />); });
  assert.ok(view);
  const footer = view.root.findByType("footer");
  assert.ok(footer.findAllByType("a").some(link => link.props.href === "/data-deletion/?lang=en"));
  await act(async () => {
    browser.location.search = "?lang=ru";
    browser.dispatchEvent(new Event("popstate"));
  });
  assert.ok(footer.findAllByType("a").some(link => link.props.href === "/data-deletion/?lang=ru"));

  const { default: DataDeletionPage } = await import("../../../../../(falcon)/data-deletion/page");
  await act(async () => { view?.update(<DataDeletionPage />); });
  assert.deepEqual(view.root.findAllByType("h1").map(heading => heading.children), [["Политика удаления данных Falcon"]]);
  await act(async () => {
    browser.location.search = "?lang=en";
    browser.dispatchEvent(new Event("popstate"));
  });
  assert.deepEqual(view.root.findAllByType("h1").map(heading => heading.children), [["Falcon Data Deletion Policy"]]);
});
