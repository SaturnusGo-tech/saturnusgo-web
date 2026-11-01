import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useCaseAuthor } from "../../../../test-cases/attribution/state/useCaseAuthor";
import { mapTestCaseRevision } from "../../../../test-cases/data/test-case-mapper";
import { TmsHttpClientProvider } from "../../../../auth/http/TmsHttpClientContext";
import type { TmsHttpClient } from "../../../../../../core/tms/transport/http";
import type { components } from "../../../../../../core/tms/generated/tms-api";
(globalThis as typeof globalThis & {
    React: typeof React;
}).React = React;
const revision: components["schemas"]["TestCaseRevision"] = { revision: 1, title: "Original", description: "", preconditions: "", type: "manual", lifecycle: "ready", priority: "medium", component: "", ownerIdentityId: null, tags: [], estimatedMinutes: null, testData: "", steps: [], checklist: [], attachmentIds: [], changeNote: "", createdBy: "human-original", createdAt: "2026-11-01T00:00:00Z", customFields: [], productGroupId: null, productId: null, regression: false };
let author: ReturnType<typeof useCaseAuthor>;
function Probe() { author = useCaseAuthor("case", "workspace", false); return null; }
test("original case author stays revision one while selected current revision preserves its Codex author", async () => {
    const paths: string[] = [];
    const http = { getResource: async (path: string) => { paths.push(path); return { data: revision, etag: null }; } } as unknown as TmsHttpClient;
    let view!: ReactTestRenderer;
    await act(async () => { view = create(<TmsHttpClientProvider client={http}><Probe /></TmsHttpClientProvider>); });
    assert.deepEqual(paths, ["/test-cases/case/revisions/1"]);
    assert.equal(author.author, "human-original");
    assert.equal(mapTestCaseRevision({ ...revision, revision: 2, createdBy: "codex-revision" }).createdBy, "codex-revision");
    await act(async () => view.unmount());
});
