import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createTmsHttpClient } from "../../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { useDefectExecutionContext, type DefectExecutionContextInput } from "../../state/useDefectExecutionContext";
import { defect, item, run } from "../fixtures/execution-fixture";

type Request = { path: string; signal: AbortSignal | null | undefined };
export async function contextHarness(handler?: (request: Request) => Response | Promise<Response>,
  overrides: Partial<DefectExecutionContextInput> = {}) {
  const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
  Object.assign(globalThis, { React });
  const requests: Request[] = [];
  const renders: ReturnType<typeof useDefectExecutionContext>[] = [];
  const client = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "qa-token", fetch: async (url, options) => {
      const request = { path: new URL(String(url)).pathname, signal: options?.signal };
      requests.push(request);
      return handler ? handler(request) : Response.json({ data: request.path.endsWith("/item-1") ? item : run });
    } });
  let current!: ReturnType<typeof useDefectExecutionContext>;
  let tree!: ReactTestRenderer;
  let input: DefectExecutionContextInput = { workspaceId: "workspace-1", defect, connected: true, ...overrides };
  function Probe({ value }: { value: DefectExecutionContextInput }) {
    current = useDefectExecutionContext(value); renders.push(current); return null;
  }
  const content = () => <TmsHttpClientProvider client={client}><Probe value={input} /></TmsHttpClientProvider>;
  await act(async () => { tree = create(content()); });
  return { requests, renders, get current() { return current; }, get input() { return input; },
    async update(change: Partial<DefectExecutionContextInput>) {
      input = { ...input, ...change }; await act(async () => tree.update(content()));
    },
    async settle(action: () => void) { await act(async () => { action(); }); },
    async dispose() {
      await act(async () => tree.unmount());
      if (previousReact) Object.defineProperty(globalThis, "React", previousReact);
      else Reflect.deleteProperty(globalThis, "React");
    } };
}
