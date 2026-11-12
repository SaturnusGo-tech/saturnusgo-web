import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { installSelectFixture } from "../presentation/select-fixture";

Object.assign(globalThis, { React });
const restore = installSelectFixture();
const { IntegrationButton } = require("../../button/IntegrationButton") as typeof import("../../button/IntegrationButton");
const { LoadingOrb } = require("../../../../../../../shared/components/loading/LoadingOrb") as typeof import("../../../../../../../shared/components/loading/LoadingOrb");
restore();

test("loading buttons use the shared Solving Orb and preserve an explicit spinner", async () => {
  let view!: ReactTestRenderer;
  const custom = <span data-custom-spinner/>;
  try {
    await act(async () => { view = create(<IntegrationButton isLoading>Save</IntegrationButton>); });
    const spinner = view.root.findByType("button").props.spinner as React.ReactElement;
    assert.equal(spinner.type, LoadingOrb);
    await act(async () => view.update(<IntegrationButton isLoading spinner={custom}>Save</IntegrationButton>));
    assert.equal(view.root.findByType("button").props.spinner, custom);
  } finally { await act(async () => view?.unmount()); }
});
