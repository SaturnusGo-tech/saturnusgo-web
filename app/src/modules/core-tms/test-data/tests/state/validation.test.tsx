import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { TestDataProvider, type TestDataContextValue } from "../../application/context/TestDataContext";
import { CaseDataProvider, useCaseData } from "../../application/editor/CaseDataContext";
const previous = Object.getOwnPropertyDescriptor(globalThis, "React");
before(() => { Object.assign(globalThis, { React }); });
after(() => { if (previous) Object.defineProperty(globalThis, "React", previous); else Reflect.deleteProperty(globalThis, "React"); });
test("read-only metadata access does not invoke binding validation requiring bind permission", async () => {
  let calls = 0, state: ReturnType<typeof useCaseData>;
  const feature = { projectId: "p", actorId: "viewer", permissions: { read: true, bind: false }, port: {
    validate: async () => { calls++; throw new Error("Forbidden"); },
  } } as unknown as TestDataContextValue;
  function Observe() { state = useCaseData(); return null; }
  let view: ReturnType<typeof create>;
  await act(async () => {
    view = create(<TestDataProvider value={feature}><CaseDataProvider bindings={[]} steps={[]} editable={false}><Observe /></CaseDataProvider></TestDataProvider>);
    await new Promise(resolve => setTimeout(resolve, 220));
  });
  assert.equal(calls, 0); assert.equal(state!.error, false); assert.equal(state!.loading, false);
  await act(async () => view!.unmount());
});
