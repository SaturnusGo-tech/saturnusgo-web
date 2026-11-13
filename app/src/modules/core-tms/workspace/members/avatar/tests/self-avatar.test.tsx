import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider, type TmsSessionIdentity } from "../../../../auth/presentation/session/TmsSessionContext";
import type { WorkspaceActor } from "../../model/actors/workspace-actor";
import { WorkspacePeopleProvider } from "../../context/WorkspacePeopleContext";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
require.extensions[".css"] = module => { module.exports = {}; };
const { MemberAvatar } = require("../MemberAvatar") as typeof import("../MemberAvatar");
const actor: WorkspaceActor = { identityId: "self", kind: "human", name: "Historical name", email: "qa@example.test" };
const session: TmsSessionIdentity = { kind: "managed", subject: "self", label: "Current name", workspaceId: "workspace",
  hasAvatar: true, avatarVersion: 3, signOut: async () => {} };

function fixture() {
  const memberReads: string[] = [];
  const http = { getResource: async (path: string) => {
    memberReads.push(path); return { data: { url: "https://media.example.test/old-company-photo", expiresAt: "2099-01-01T00:00:00Z" } };
  } } as unknown as TmsHttpClient;
  const render = (identity: TmsSessionIdentity, options: { workspaceId?: string; actor?: WorkspaceActor; offline?: boolean;
    people?: { workspaceId: string; offline: boolean } } = {}) => {
    const avatar = <MemberAvatar workspaceId={options.workspaceId ?? "workspace"} identityId={(options.actor ?? actor).identityId}
      name="Historical name" actor={options.actor ?? actor} offline={options.offline} />;
    return <TmsHttpClientProvider client={http}><TmsSessionProvider value={identity}>
      {options.people ? <WorkspacePeopleProvider {...options.people}>{avatar}</WorkspacePeopleProvider> : avatar}
    </TmsSessionProvider></TmsHttpClientProvider>;
  };
  return { render, memberReads };
}

test("an existing author avatar follows saved self-profile versions without changing historical attribution", async () => {
  const h = fixture(); let view!: ReactTestRenderer, current = "https://media.example.test/new-photo", reads = 0;
  const avatarLoader = async () => { reads++; return { url: current, expiresAt: "2099-01-01T00:00:00Z" }; };
  await act(async () => { view = create(h.render({ ...session, avatarLoader })); });
  assert.equal(view.root.findByType("img").props.src, current);
  current = "https://saturnusgo.com/falcon/avatars/v2/nora.webp";
  await act(async () => view.update(h.render({ ...session, avatarLoader, avatarVersion: 4 })));
  assert.equal(view.root.findByType("img").props.src, current);
  assert.equal(reads, 2, "a profile version change invalidates the mounted author avatar");
  assert.deepEqual(h.memberReads, [], "self images use the current profile source");
  assert.equal(actor.name, "Historical name");
  await act(async () => view.update(h.render({ ...session, avatarLoader, hasAvatar: false, avatarVersion: 5 })));
  assert.equal(view.root.findAllByType("img").length, 0);
  await act(async () => view.unmount());
});

test("cloud authors can use their current profile avatar by exact stable actor ID", async () => {
  const h = fixture(); let view!: ReactTestRenderer;
  const cloud = { ...session, kind: "cloud" as const, subject: "cloud:self",
    avatarLoader: async () => ({ url: "https://media.example.test/cloud-photo", expiresAt: "2099-01-01T00:00:00Z" }) };
  await act(async () => { view = create(h.render(cloud, { actor: { ...actor, identityId: "cloud:self" } })); });
  assert.equal(view.root.findByType("img").props.src, "https://media.example.test/cloud-photo");
  assert.deepEqual(h.memberReads, []);
  await act(async () => view.unmount());
});

test("matching names, different workspaces and offline actors cannot consume the self avatar", async () => {
  const h = fixture(); let view!: ReactTestRenderer, selfReads = 0;
  const identity = { ...session, avatarLoader: async () => { selfReads++; return { url: "https://media.example.test/private-self-photo", expiresAt: "2099-01-01T00:00:00Z" }; } };
  await act(async () => { view = create(h.render(identity, { actor: { ...actor, identityId: "other" } })); });
  assert.deepEqual(h.memberReads, ["/company/members/other/avatar"]);
  assert.equal(selfReads, 0);
  await act(async () => view.update(h.render(identity, { workspaceId: "different-workspace" })));
  assert.equal(selfReads, 0);
  assert.equal(view.root.findByType("img").props.src, "https://media.example.test/old-company-photo");
  await act(async () => view.update(h.render(identity, { offline: true })));
  assert.equal(selfReads, 0);
  assert.equal(view.root.findAllByType("img").length, 0);
  await act(async () => view.unmount());
});

test("an offline people context suppresses only avatars in its matching nonempty workspace", async () => {
  const h = fixture(); let view!: ReactTestRenderer, selfReads = 0;
  const identity = { ...session, avatarLoader: async () => {
    selfReads++; return { url: "https://media.example.test/self-photo", expiresAt: "2099-01-01T00:00:00Z" };
  } };
  await act(async () => { view = create(h.render(identity, { people: { workspaceId: "workspace", offline: true } })); });
  assert.equal(selfReads, 0, "the matching offline workspace must not load the authenticated profile image");
  assert.equal(view.root.findAllByType("img").length, 0);
  assert.deepEqual(h.memberReads, []);
  await act(async () => view.update(h.render(identity, { people: { workspaceId: "other-workspace", offline: true } })));
  assert.equal(selfReads, 1, "an unrelated provider cannot disable the explicit target workspace");
  assert.equal(view.root.findByType("img").props.src, "https://media.example.test/self-photo");
  await act(async () => view.update(h.render(identity, { people: { workspaceId: "", offline: true } })));
  assert.equal(view.root.findByType("img").props.src, "https://media.example.test/self-photo");
  await act(async () => view.unmount());
});
