import React, { useState } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TestContext } from "node:test";
import { useWritingDictation } from "../../state/useWritingDictation";
import type { WritingTarget } from "../../../model/target";
import { FakeRecognition } from "../harness";

Object.assign(globalThis, { React });
type Config = Omit<Parameters<typeof useWritingDictation>[0], "instruction" | "onChange">;
export const target = (): WritingTarget => ({ text: "Original case", selected: true, apply: () => true, restore() {} });

export function hookHarness(t: TestContext, options: {
  text?: string; prefixed?: boolean; unavailable?: boolean; insecure?: boolean; config?: Partial<Config>;
} = {}) {
  const instances: FakeRecognition[] = [], changes: string[] = [];
  let applied = 0, networkCalls = 0;
  class Recognition extends FakeRecognition { constructor() { super(); instances.push(this); } }
  const browser = { isSecureContext: !options.insecure,
    ...(!options.unavailable ? { [options.prefixed ? "webkitSpeechRecognition" : "SpeechRecognition"]: Recognition } : {}) };
  const document = Object.assign(new EventTarget(), { hidden: false });
  const originals = new Map<string, PropertyDescriptor | undefined>();
  for (const [key, value] of Object.entries({ window: browser, document, fetch: () => { networkCalls++; throw new Error("Unexpected network request"); } })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  let config: Config = { enabled: true, ru: true, workspaceId: "workspace-a", target: {
    ...target(), apply: () => { applied++; return true; },
  }, ...options.config };
  let state!: ReturnType<typeof useWritingDictation>, text = options.text ?? "", tree!: ReactTestRenderer;
  function Probe(props: Config) {
    const [value, setValue] = useState(options.text ?? "");
    text = value;
    state = useWritingDictation({ ...props, instruction: value, onChange: (next) => { changes.push(next); setValue(next); } });
    return null;
  }
  act(() => { tree = create(<Probe {...config} />); });
  t.after(() => {
    act(() => tree.unmount());
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  return { instances, changes, document,
    get: () => state, text: () => text, applied: () => applied, networkCalls: () => networkCalls,
    update: (next: Partial<Config>) => { config = { ...config, ...next }; act(() => tree.update(<Probe {...config} />)); },
    unmount: () => act(() => tree.unmount()),
    start: () => { act(() => state.start()); return instances[instances.length - 1]!; },
  };
}
