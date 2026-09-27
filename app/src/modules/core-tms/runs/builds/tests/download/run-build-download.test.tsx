import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { AttachmentClientProvider } from "../../../../attachments/presentation/context/AttachmentClientProvider";
import type { AttachmentReadAccess, CreateAttachmentAccessInput } from "../../../../attachments/domain/attachment";
import { useRunBuildDownload } from "../../state/download/useRunBuildDownload";
import { buildClient } from "../support/build-fixture";

type Anchor = { href: string; download: string; target: string; rel: string; click(): void; remove(): void };
type Request = { input: CreateAttachmentAccessInput; resolve(value: AttachmentReadAccess): void; reject(error: unknown): void };
const access = (url = "https://storage.example/release.apk?signature=private"): AttachmentReadAccess => ({
  attachmentId: "build-a", method: "GET", url, headers: {}, expiresAt: "2030-01-01T00:00:00Z",
});

async function setup(t: TestContext) {
  const originalReact = Object.getOwnPropertyDescriptor(globalThis, "React");
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const clicks: Anchor[] = []; const attached = new Set<Anchor>(); const requests: Request[] = [];
  Object.assign(globalThis, { React, document: {
    body: { append: (link: Anchor) => attached.add(link) },
    createElement: (tag: string): Anchor => {
      assert.equal(tag, "a");
      const link: Anchor = { href: "", download: "", target: "", rel: "",
        click: () => { assert.ok(attached.has(link)); clicks.push(link); }, remove: () => { attached.delete(link); } };
      return link;
    },
  } });
  const client = { ...buildClient().client, createAccess: (input: CreateAttachmentAccessInput) =>
    new Promise<AttachmentReadAccess>((resolve, reject) => requests.push({ input, resolve, reject })) };
  let state!: ReturnType<typeof useRunBuildDownload>; let renderer!: ReactTestRenderer;
  function Probe() { state = useRunBuildDownload("build-a", false); return null; }
  const element = (current = client) => <AttachmentClientProvider client={current}><Probe /></AttachmentClientProvider>;
  t.after(async () => {
    await act(async () => renderer?.unmount());
    for (const [name, descriptor] of [["React", originalReact], ["document", originalDocument]] as const) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name);
    }
  });
  await act(async () => { renderer = create(element()); });
  return { requests, clicks, attached, state: () => state,
    start: () => act(async () => { void state.download(); }),
    unmount: () => act(async () => renderer.unmount()),
    replaceClient: () => act(async () => renderer.update(element({ ...client }))),
  };
}

test("repeated clicks request one attachment grant and preserve the workspace tab", async (t) => {
  const h = await setup(t);
  await act(async () => { void h.state().download(); void h.state().download(); });
  assert.equal(h.requests.length, 1); assert.equal(h.state().pending, true);
  assert.equal(h.requests[0].input.attachmentId, "build-a");
  assert.equal(h.requests[0].input.disposition, "attachment");
  await act(async () => h.requests[0].resolve(access()));
  assert.equal(h.clicks.length, 1); assert.equal(h.attached.size, 0);
  assert.equal(h.clicks[0].target, "_blank", "A cross-origin storage error must not navigate Falcon away");
  assert.match(h.clicks[0].rel, /noopener/); assert.match(h.clicks[0].rel, /noreferrer/);
  assert.equal(h.state().pending, false); assert.equal(h.state().error, "");
});

for (const [status, message] of [
  [401, "Sign in again to download the build."],
  [403, "You do not have access to this build."],
  [500, "Could not download the build. Try again."],
] as const) test(`download failure ${status} is visible and can be retried`, async (t) => {
  const h = await setup(t); await h.start();
  await act(async () => h.requests[0].reject(Object.assign(new Error("failure"), { status })));
  assert.equal(h.state().pending, false); assert.equal(h.state().error, message); assert.equal(h.clicks.length, 0);
  await h.start(); assert.equal(h.requests.length, 2); assert.equal(h.state().error, "");
  await act(async () => h.requests[1].resolve(access()));
  assert.equal(h.clicks.length, 1); assert.equal(h.state().pending, false);
});

test("leaving the run cancels the grant and ignores a late response", async (t) => {
  const h = await setup(t); await h.start(); await h.unmount();
  assert.equal(h.requests[0].input.signal?.aborted, true);
  await act(async () => h.requests[0].resolve(access()));
  assert.equal(h.clicks.length, 0); assert.equal(h.attached.size, 0);
});

test("unsafe access URLs and signed request headers never become browser links", async (t) => {
  const h = await setup(t);
  for (const value of [access("javascript:alert(1)"), { ...access(), headers: { Authorization: "secret" } }]) {
    await h.start();
    await act(async () => h.requests[h.requests.length - 1].resolve(value));
    assert.equal(h.clicks.length, 0); assert.equal(h.state().pending, false); assert.ok(h.state().error);
  }
});

test("replacing the attachment client cancels the old grant and allows another download", async (t) => {
  const h = await setup(t); await h.start(); await h.replaceClient();
  assert.equal(h.requests[0].input.signal?.aborted, true);
  assert.equal(h.state().pending, false, "The button must recover after its client changes");
  await act(async () => h.requests[0].resolve(access()));
  assert.equal(h.clicks.length, 0);
  await h.start(); await act(async () => h.requests[1].resolve(access()));
  assert.equal(h.clicks.length, 1); assert.equal(h.state().pending, false);
});
