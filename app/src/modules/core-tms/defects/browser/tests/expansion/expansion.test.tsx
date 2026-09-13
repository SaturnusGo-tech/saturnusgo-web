import React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import { act, create } from "react-test-renderer";
import { useDefectExpansion } from "../../state/expansion/useDefectExpansion";

test("folders start open, manual collapse survives refresh, and a new scope starts open", () => {
  let result!: ReturnType<typeof useDefectExpansion>;
  function Harness({ scope }: { scope: string }) { result = useDefectExpansion(scope); return null; }
  let tree!: ReturnType<typeof create>;
  act(() => { tree = create(<Harness scope="project-a" />); });
  assert.deepEqual(result.collapsed, []);
  act(() => result.toggle("Payments"));
  assert.deepEqual(result.collapsed, ["Payments"]);
  act(() => tree.update(<Harness scope="project-a" />));
  assert.deepEqual(result.collapsed, ["Payments"]);
  act(() => result.toggle("Payments"));
  assert.deepEqual(result.collapsed, []);
  act(() => result.toggle("Orders"));
  act(() => tree.update(<Harness scope="project-b" />));
  assert.deepEqual(result.collapsed, []);
  act(() => result.toggle("Auth"));
  assert.deepEqual(result.collapsed, ["Auth"]);
  act(() => tree.unmount());
});
