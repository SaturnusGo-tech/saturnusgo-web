import React, { useState } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TestContext } from "node:test";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { WritingTarget } from "../../../model/target";
import { useWritingDictation } from "../../state/useWritingDictation";
import { browserHarness, deferred, flush } from "../support/browser";

Object.assign(globalThis, { React });
type Config = Omit<Parameters<typeof useWritingDictation>[0], "instruction" | "onChange">;
export const target = (): WritingTarget => ({ text: "Original", selected: true, apply: () => true, restore() {} });

export function hookHarness(t: TestContext, options: {
  text?: string; config?: Partial<Config>; browser?: Parameters<typeof browserHarness>[0];
} = {}) {
  let tree: ReactTestRenderer | undefined;
  t.after(() => { if (tree) act(() => tree?.unmount()); });
  const browser = browserHarness(options.browser), document = browser.install(t);
  const requests: { path: string; method: string; body: { audio: string; language?: string }; signal?: AbortSignal; reply: ReturnType<typeof deferred<{ text: string }>> }[] = [];
  const changes: string[] = []; let applied = 0;
  const http = { mutate: (path: string, method: string, body: { audio: string; language?: string }, signal?: AbortSignal) => {
    const reply = deferred<{ text: string }>(); requests.push({ path, method, body, signal, reply }); return reply.promise;
  } } as TmsHttpClient;
  let config: Config = { enabled: true, ru: true, workspaceId: "workspace-a", target: {
    ...target(), apply: () => { applied++; return true; },
  }, ...options.config };
  let state!: ReturnType<typeof useWritingDictation>, text = options.text ?? "", edit!: (value: string) => void;
  function Probe(props: Config) {
    const [value, setValue] = useState(options.text ?? ""); text = value; edit = setValue;
    state = useWritingDictation({ ...props, instruction: value, onChange: (next) => { changes.push(next); setValue(next); } });
    return null;
  }
  const render = () => <TmsHttpClientProvider client={http}><Probe {...config} /></TmsHttpClientProvider>;
  act(() => { tree = create(render()); });
  return { browser, document, requests, changes, get: () => state, text: () => text, applied: () => applied,
    start: async () => { await act(async () => { state.start(); await flush(); }); },
    startSync: () => act(() => state.start()),
    samples: (count = 24000, value = .2) => act(() => browser.nodes[browser.nodes.length - 1].samples(Float32Array.from({ length: count }, (_, i) => Math.sin(i / 10) * value))),
    stop: async () => { await act(async () => { state.stop(); await flush(); }); },
    reply: async (text: string) => { await act(async () => { requests[requests.length - 1].reply.resolve({ text }); await flush(); }); },
    update: (next: Partial<Config>) => { config = { ...config, ...next }; act(() => tree?.update(render())); },
    edit: (value: string) => act(() => edit(value)), unmount: () => act(() => { tree?.unmount(); tree = undefined; }),
  };
}
