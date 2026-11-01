import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import { TmsSessionProvider } from "../../../../auth/presentation/session/TmsSessionContext";
(globalThis as typeof globalThis & {
    React: typeof React;
}).React = React;
require.extensions[".css"] = module => { module.exports = {}; };
const { MemberAvatar } = require("../../../../workspace/members/avatar/MemberAvatar") as typeof import("../../../../workspace/members/avatar/MemberAvatar");
test("inactive Codex is an official asset without human avatar fetch; a human named Codex keeps human avatar behavior", async () => {
    const requests: string[] = [];
    const http = { getResource: async (path: string) => { requests.push(path); return { data: { url: "https://company.test/avatar.png" }, etag: null }; } } as unknown as TmsHttpClient;
    const session = { kind: "managed" as const, label: "Tester", subject: "human", workspaceId: "workspace", signOut: async () => { } };
    const render = (agent: boolean) => <TmsHttpClientProvider client={http}><TmsSessionProvider value={session}>
    <MemberAvatar identityId={agent ? "agent" : "human"} name={agent ? "Renamed service" : "Codex"} actor={agent ? { identityId: "agent", kind: "agent", provider: "codex", name: "Codex", status: "inactive" } : { identityId: "human", kind: "human", name: "Codex", email: "codex@example.test" }}/>
  </TmsSessionProvider></TmsHttpClientProvider>;
    let view!: ReactTestRenderer;
    await act(async () => { view = create(render(true)); });
    assert.equal(requests.length, 0);
    assert.equal(view.root.findAllByType("img").length, 2);
    assert.match(view.root.findAllByType("img")[0].props.src, /assets\/integrations\/codex/);
    await act(async () => view.update(render(false)));
    assert.deepEqual(requests, ["/company/members/human/avatar"]);
    assert.match(view.root.findByType("img").props.src, /avatar.png/);
    await act(async () => view.unmount());
});
