import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { WorkspaceConnectorProvider, useWorkspaceConnectors } from "../../application/context/WorkspaceConnectorContext";
import { TmsHttpClientProvider } from "../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../auth/presentation/session/TmsSessionContext";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import type { Connection } from "../../model/connector-types";
void test("connector catalog is workspace-owned; project switches and API-only access never read legacy Swagger", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  const pending: { path: string; signal: AbortSignal; resolve: (data: { data: Connection[] }) => void }[] = [];
  const http = { get: (path: string, signal: AbortSignal) => new Promise(resolve => pending.push({ path, signal, resolve })),
    getResource: () => { throw new Error("Legacy Swagger configuration must not be requested"); } } as unknown as TmsHttpClient;
  let current!: ReturnType<typeof useWorkspaceConnectors>;
  function Probe() { current = useWorkspaceConnectors(); return null; }
  function Harness({ workspace = "w", project = "p", capabilities = ["core", "api_testing", "integrations"] }) {
    return <TmsHttpClientProvider client={http}><TmsSessionProvider value={{ kind: "managed", label: "QA", subject: "qa", companyCapabilities: capabilities, signOut: async () => {} }}>
      <WorkspaceConnectorProvider workspaceId={workspace} projectId={project} active><Probe/></WorkspaceConnectorProvider>
    </TmsSessionProvider></TmsHttpClientProvider>;
  }
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(<Harness/>); });
    assert.equal(pending.length, 1); assert.equal(pending[0].path, "/integrations/connectors?workspaceId=w");
    await act(async () => pending[0].resolve({ data: [] })); assert.equal(current.state, "ready");
    await act(async () => renderer.update(<Harness project="other"/>)); assert.equal(pending.length, 1);
    await act(async () => current.refresh());
    await act(async () => renderer.update(<Harness workspace="new"/>)); assert.equal(pending[1].signal.aborted, true);
    await act(async () => pending[1].resolve({ data: [{ id: "stale" } as Connection] })); assert.deepEqual(current.connections, []);
    await act(async () => renderer.update(<Harness capabilities={["core", "api_testing"]}/>));
    assert.equal(pending[2].signal.aborted, true); assert.equal(pending.length, 3); assert.deepEqual(current.connections, []);
  } finally { await act(async () => renderer?.unmount()); if (original) Object.defineProperty(globalThis, "React", original); else Reflect.deleteProperty(globalThis, "React"); }
});

void test("reader Slack catalog enables mention notifications while core-only company makes no catalog request", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "React"); Object.assign(globalThis, { React });
  const calls: string[] = [];
  const http = { get: async (path: string) => { calls.push(path); return { data: [{ id: "slack", projectId: "p", provider: "slack", enabled: true }] }; } } as unknown as TmsHttpClient;
  let current!: ReturnType<typeof useWorkspaceConnectors>;
  function Probe() { current = useWorkspaceConnectors(); return null; }
  function Harness({ capabilities }: { capabilities: string[] }) {
    return <TmsHttpClientProvider client={http}><TmsSessionProvider value={{ kind: "managed", label: "Tester", subject: "tester", companyCapabilities: capabilities, signOut: async () => {} }}>
      <WorkspaceConnectorProvider workspaceId="w" projectId="p" active><Probe/></WorkspaceConnectorProvider>
    </TmsSessionProvider></TmsHttpClientProvider>;
  }
  let renderer!: ReactTestRenderer;
  try {
    await act(async () => { renderer = create(<Harness capabilities={["core", "integrations"]}/>); });
    assert.equal(calls.length, 1); assert.equal(current.connections[0].provider, "slack");
    const { componentHarness, nodes } = await import("../../../portfolios/tests/support/component-harness");
    const h = componentHarness();
    const { CommentComposer } = h.load<{ CommentComposer: (props: never) => unknown }>(new URL("../../../presentation/cases/collaboration/composer/CommentComposer.tsx", import.meta.url), name => {
      if (name.endsWith("useFormLeave")) return { useFormLeave: () => ({ release() {}, close: (action: () => void) => action() }) };
      if (name.endsWith("WorkspaceConnectorContext")) return { useWorkspaceConnectors: () => current };
      if (name.endsWith("useCommentAttachments")) return { useCommentAttachments: () => ({ references: [], entries: [], blocked: false }) };
      if (name.endsWith("comment-attachments")) return { readCommentAttachments: () => ({ text: "Hello", attachments: [] }), writeCommentAttachments: (body: string) => body };
    });
    let submitted: { notifyChannels?: string[] } | undefined;
    const render = () => nodes(h.render(() => CommentComposer({ projectId: "p", initial: { mentions: ["user"] }, pending: false,
      onSubmit: async (draft: { notifyChannels?: string[] }) => { submitted = draft; return true; } } as never)));
    const checkbox = render().find(node => node.type === "input" && node.props.type === "checkbox")!;
    assert.equal(checkbox.props.disabled, false); (checkbox.props.onChange as (event: unknown) => void)({ target: { checked: true } });
    const send = render().find(node => node.type === "button" && Array.isArray(node.props.children) && node.props.children.includes("Save"))!;
    (send.props.onClick as () => void)(); await Promise.resolve();
    assert.deepEqual(Array.from(submitted?.notifyChannels ?? []), ["slack"]);
    await act(async () => renderer.update(<Harness capabilities={["core"]}/>));
    assert.equal(calls.length, 1); assert.deepEqual(current.connections, []);
  } finally { await act(async () => renderer?.unmount()); if (original) Object.defineProperty(globalThis, "React", original); else Reflect.deleteProperty(globalThis, "React"); }
});
