import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useSpaceChoice } from "../../application/useSpaceChoice";
import type { SpaceChoicePort } from "../../application/space-choice-port";
let current: ReturnType<typeof useSpaceChoice>;
function Probe({ port }: { port: SpaceChoicePort }) { current = useSpaceChoice(port, "https://tms.saturnusgo.com"); return null; }
const fixture = (): SpaceChoicePort => ({
  list: async () => ({ spaces: [{ id: "personal-1", name: "My workspace", kind: "personal" }, { id: "company-1", name: "Alpha", kind: "company" }] }),
  select: async () => ({ redirectUrl: "https://tms.saturnusgo.com/testcases/umbrella-home/work/" }), cancel: async () => {},
});
async function mount(port = fixture()) { let view!: ReactTestRenderer; await act(async () => { view = create(<Probe port={port} />); }); return view; }
void test("only verified loaded spaces can be selected and company selection uses its canonical fresh login", async () => {
  const ids: string[] = [];
  const view = await mount({ ...fixture(), select: async id => { ids.push(id); return { redirectUrl: "https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch" }; } });
  assert.equal(current.state.spaces?.length, 2);
  await act(async () => { await current.select("not-in-proof"); }); assert.deepEqual(ids, []);
  await act(async () => { await current.select("company-1"); }); assert.deepEqual(ids, ["company-1"]);
  assert.equal(current.state.destination, "https://alpha-falcon.saturnusgo.com/api/v1/auth/google/launch");
  await act(async () => view.unmount());
});
void test("cancel invalidates the chooser and ignores a late selection response", async () => {
  let finish!: (value: { redirectUrl: string }) => void; let cancellations = 0, selections = 0;
  const view = await mount({ ...fixture(), select: () => { selections++; return new Promise(resolve => { finish = resolve; }); }, cancel: async () => { cancellations++; } });
  let pending!: Promise<void>;
  await act(async () => { pending = current.select("personal-1"); void current.select("company-1"); });
  await act(async () => { await current.cancel(); });
  await act(async () => { finish({ redirectUrl: "https://tms.saturnusgo.com/testcases/umbrella-home/work/" }); await pending; });
  assert.equal(selections, 1); assert.equal(cancellations, 1); assert.equal(current.state.destination, "/cloud-login/");
  await act(async () => view.unmount());
});
void test("expired proof clears previously loaded names and returns an actionable sign-in error", async () => {
  const view = await mount({ ...fixture(), select: async () => { throw Object.assign(new Error("expired"), { code: "SPACE_PROOF_INVALID" }); } });
  await act(async () => { await current.select("personal-1"); });
  assert.equal(current.state.error, "SPACE_PROOF_INVALID"); assert.equal(current.state.spaces, null);
  await act(async () => view.unmount());
});
void test("invalid external redirects are never followed", async () => {
  const view = await mount({ ...fixture(), select: async () => ({ redirectUrl: "https://evil.test/" }) });
  await act(async () => { await current.select("company-1"); });
  assert.equal(current.state.destination, null); assert.equal(current.state.error, "INVALID_RESPONSE");
  await act(async () => view.unmount());
});
