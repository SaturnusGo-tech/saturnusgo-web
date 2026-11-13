import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { createTmsHttpClient } from "../../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { TmsLocaleContext } from "../../../../localization/context/TmsLocaleProvider";
import { mapDefect } from "../../../data/defect-mapper";
import { useDefectSourceNavigation } from "../../state/useDefectSourceNavigation";
import { defectDto } from "../fixture/defect-dto";

type Input = Parameters<typeof useDefectSourceNavigation>[0];
type Request = { path: string; method: string; signal: AbortSignal | null | undefined };

export async function navigationHarness(handler: (request: Request) => Response | Promise<Response>,
  overrides: Partial<Input> = {}) {
  const previousReact = Object.getOwnPropertyDescriptor(globalThis, "React");
  Object.assign(globalThis, { React });
  const requests: Request[] = [];
  const destinations: unknown[][] = [];
  const renders: ReturnType<typeof useDefectSourceNavigation>[] = [];
  const client = createTmsHttpClient({ apiBase: "https://api.example.test/api/v1",
    accessToken: async () => "qa-token", fetch: async (url, options) => {
      const request = { path: new URL(String(url)).pathname, method: options?.method ?? "GET", signal: options?.signal };
      requests.push(request); return handler(request);
    } });
  const original = mapDefect({ ...defectDto, sourceCaseId: null, occurrence: null, reproduction: null,
    sourceLocation: { ...defectDto.sourceLocation, origin: "manual" } });
  let input: Input = { workspaceId: "workspace-1", defect: original, connected: true,
    onOpenFolder: (...destination) => destinations.push(destination), ...overrides };
  let current!: ReturnType<typeof useDefectSourceNavigation>;
  let tree!: ReactTestRenderer;
  let disposed = false;
  function Probe() { current = useDefectSourceNavigation(input); renders.push(current); return null; }
  const content = () => <TmsHttpClientProvider client={client}>
    <TmsLocaleContext.Provider value={{ locale: "en", languageTag: "en-US", setLocale() {}, t: key => key }}>
      <Probe />
    </TmsLocaleContext.Provider>
  </TmsHttpClientProvider>;
  await act(async () => { tree = create(content()); });
  return { requests, destinations, renders, original, get current() { return current; },
    async start() {
      let work!: Promise<void>;
      await act(async () => { work = current.open(); });
      return { work };
    },
    async update(change: Partial<Input>) {
      input = { ...input, ...change }; await act(async () => tree.update(content()));
    },
    async settle(action: () => void | Promise<void>) { await act(async () => { await action(); }); },
    async dispose() {
      if (disposed) return; disposed = true;
      await act(async () => tree.unmount());
      if (previousReact) Object.defineProperty(globalThis, "React", previousReact);
      else Reflect.deleteProperty(globalThis, "React");
    } };
}
