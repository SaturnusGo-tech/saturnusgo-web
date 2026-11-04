import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useGoogleLink } from "../../application/useGoogleLink";
import type { GoogleLinkPort } from "../../application/google-link-port";
let current: ReturnType<typeof useGoogleLink>;
function Probe({ port, company = true }: { port: GoogleLinkPort; company?: boolean }) { current = useGoogleLink(port, company); return null; }
const fixture = (): GoogleLinkPort => ({ methods: async () => ({ google: true, email: true, saml: false, signup: false }),
  startGoogle: async () => ({ authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=opaque" }), cancelFederation: async () => {} });
async function mount(port = fixture(), company = true) {
  let view!: ReactTestRenderer; await act(async () => { view = create(<Probe port={port} company={company} />); }); return view;
}
void test("explicit linking starts Google for the current signed-in account and is single-flight", async () => {
  let finish!: (value: { authorizationUrl: string }) => void;
  const intents: string[] = [];
  const view = await mount({ ...fixture(), startGoogle: intent => { intents.push(intent); return new Promise(resolve => { finish = resolve; }); } });
  assert.equal(current.state.available, true);
  let first!: Promise<void>;
  await act(async () => { first = current.link(); void current.link(); });
  assert.deepEqual(intents, ["link"]);
  await act(async () => { finish({ authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth?state=opaque" }); await first; });
  assert.match(current.state.destination ?? "", /^https:\/\/accounts.google.com\//);
  await act(async () => view.unmount());
});
void test("personal/platform context and an unavailable provider cannot start company linking", async () => {
  let requests = 0;
  const port = { ...fixture(), methods: async () => { requests++; return { google: false, email: true, saml: false, signup: false }; },
    startGoogle: async () => { requests++; return { authorizationUrl: "https://accounts.google.com/" }; } };
  const personal = await mount(port, false);
  await act(async () => { await current.link(); });
  assert.equal(requests, 0); assert.equal(current.state.available, false);
  await act(async () => personal.unmount());
  const company = await mount(port);
  await act(async () => { await current.link(); });
  assert.equal(requests, 1); assert.equal(current.state.available, false);
  await act(async () => company.unmount());
});
void test("leaving the profile invalidates a pending provider and ignores its late response", async () => {
  let finish!: (value: { authorizationUrl: string }) => void; let cancelled = 0;
  const view = await mount({ ...fixture(), startGoogle: () => new Promise(resolve => { finish = resolve; }), cancelFederation: async () => { cancelled++; } });
  let linking!: Promise<void>;
  await act(async () => { linking = current.link(); });
  await act(async () => view.unmount());
  await act(async () => { finish({ authorizationUrl: "https://accounts.google.com/late" }); await linking; });
  assert.equal(cancelled, 1); assert.equal(current.state.destination, null);
});
