import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsApiError, type TmsHttpClient } from "../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import type { ConnectionInput } from "../../model/connector-types";

Object.assign(globalThis, { React });
const previous = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { ConnectorSettings } = require("../../presentation/ConnectorSettings") as typeof import("../../presentation/ConnectorSettings");
const { ErrorToast } = require("../../../presentation/common/error/ErrorToast") as typeof import("../../../presentation/common/error/ErrorToast");
if (previous) require.extensions[".css"] = previous;
else delete require.extensions[".css"];

test("Linear gateway failure retries discovery without reloading or disclosing credentials", async () => {
  const attempts: ConnectionInput[] = [];
  let configurationLoads = 0;
  const http = {
    getResource: async () => { configurationLoads++; return { data: null, etag: '"0"' }; },
    get: async (path: string) => {
      if (path.includes("/catalog?")) return { data: { projects: [{ id: "p", name: "Project" }] } };
      if (path.includes("/webhook-setup?")) return { data: { url: null } };
      return { data: [], nextCursor: null };
    },
    mutate: async (path: string, method: string, input: ConnectionInput) => {
      assert.equal(path, "/integrations/connectors/linear/discovery?workspaceId=w&projectId=p");
      assert.equal(method, "POST");
      attempts.push(input);
      if (attempts.length === 1) throw new TmsApiError("test-only-token", 502, "test-request");
      return { account: "Linear QA", resources: [{ id: "QA", name: "Quality" }] };
    },
  } as unknown as TmsHttpClient;
  let view!: ReactTestRenderer;
  try {
    await act(async () => {
      view = create(<TmsHttpClientProvider client={http}>
        <ConnectorSettings workspaceId="w" projectId="p" provider="linear" ru={false} canManage capabilities={[]} connected
          onBack={() => {}} onSaved={() => {}} embedded />
      </TmsHttpClientProvider>);
    });
    const field = (label: string) => view.root.findAllByType("label")
      .find(node => node.children.includes(label))!.findByType("input");
    act(() => field("API key").props.onChange({ target: { value: "test-only-token" } }));
    act(() => field("Linear team ID or key").props.onChange({ target: { value: "QA" } }));
    await act(async () => view.root.findAllByType("button").find(node => node.children.includes("Verify access"))!.props.onClick());
    const toast = view.root.findByType(ErrorToast);
    assert.match(toast.props.message, /Could not verify access to Linear.*test-request/);
    assert.doesNotMatch(toast.props.message, /test-only-token/);
    assert.equal(toast.props.onRetry, undefined);
    assert.equal(view.root.findAllByProps({ role: "alert" }).length, 0);
    await act(async () => view.root.findAllByType("button").find(node => node.children.includes("Verify access"))!.props.onClick());
    assert.equal(configurationLoads, 1);
    assert.equal(attempts.length, 2);
    assert.equal(attempts[1].secrets.apiToken, "test-only-token");
    assert.equal(attempts[1].settings.remoteId, "QA");
    assert.match(JSON.stringify(view.toJSON()), /Linear QA/);
    assert.equal(view.root.findByType(ErrorToast).props.message, undefined);
  } finally {
    await act(async () => view?.unmount());
  }
});
