import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { IntegrationControlScope } from "../../scope/IntegrationControlScope";
import { useIntegrationControlDisabled } from "../../scope/useIntegrationControlDisabled";

Object.assign(globalThis, { React });
const seen: boolean[] = [];
function Probe({ own = false }: { own?: boolean }) {
  seen.push(useIntegrationControlDisabled(own)); return null;
}

test("permission and pending scopes cannot be overridden by a child or own false", async () => {
  let view!: ReactTestRenderer;
  try {
    await act(async () => { view = create(<Probe/>); });
    assert.equal(seen[seen.length - 1], false);
    await act(async () => view.update(<Probe own/>));
    assert.equal(seen[seen.length - 1], true);
    await act(async () => view.update(<IntegrationControlScope disabled><IntegrationControlScope disabled={false}><Probe/></IntegrationControlScope></IntegrationControlScope>));
    assert.equal(seen[seen.length - 1], true);
    await act(async () => view.update(<IntegrationControlScope disabled={false}><Probe/></IntegrationControlScope>));
    assert.equal(seen[seen.length - 1], false);
  } finally { await act(async () => view?.unmount()); }
});
