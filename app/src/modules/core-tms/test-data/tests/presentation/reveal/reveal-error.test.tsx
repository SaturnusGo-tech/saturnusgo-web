import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../../application/context/TestDataContext";
import { installRenderControls } from "../../support/render-controls";
const require = createRequire(import.meta.url);
test("a changed or disabled credential closes the reveal workflow without retrying a new version", async () => {
  const previous = ["React", "window", "document"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  Object.assign(globalThis, { React, window: new EventTarget(), document: Object.assign(new EventTarget(), { hidden: false }) });
  const restore = installRenderControls({ portals: true });
  let Dialog: typeof import("../../../presentation/reveal/SecretRevealDialog")["SecretRevealDialog"];
  try { Dialog = require("../../../presentation/reveal/SecretRevealDialog").SecretRevealDialog; } finally { restore(); }
  try {
    for (const code of ["CREDENTIAL_VERSION_CHANGED", "CREDENTIAL_DISABLED"]) {
      let calls = 0, closed = 0;
      const feature = { actorId: "qa", projectId: "p", permissions: { reveal: true }, port: {
        reveal: async () => { calls++; throw { code, message: "unsafe-server-text" }; },
      } } as unknown as TestDataContextValue;
      let view: ReturnType<typeof create> | undefined;
      try {
        await act(async () => { view = create(<TestDataProvider value={feature}><Dialog ru={false} target={{ resourceId: "credential", field: "password", secretVersionId: "v1", environmentId: "staging", executionId: "attempt" }} onClose={() => { closed++; }} /></TestDataProvider>); });
        await act(async () => { view!.root.findByType("form").props.onSubmit({ preventDefault() {} }); });
        const text = JSON.stringify(view!.toJSON());
        assert.ok(text.includes("start a new attempt") || text.includes("Start a new attempt"));
        assert.equal(text.includes("unsafe-server-text"), false); assert.equal(view!.root.findAllByType("form").length, 0);
        assert.equal(calls, 1, "the fixed attempt must not silently retry another credential version");
        await act(async () => { view!.root.findByType("button").props.onPress(); });
        assert.equal(closed, 1);
      } finally { await act(async () => view?.unmount()); }
    }
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
    }
  }
});
