import assert from "node:assert/strict";
import test from "node:test";

import type { TmsHttpClient } from "../../../../core/tms/transport/http";
import { createSharedStep, listSharedSteps } from "../data/shared-step-api";

test("shared-step adapter uses project-scoped collection routes", async () => {
  const calls: Array<{ path: string; method?: string; body?: unknown }> = [];
  const now = "2026-09-03T17:00:00.000Z";
  const http = {
    async get(path: string) { calls.push({ path }); return { data: [],
      meta: { limit: 100, hasMore: false, nextCursor: null } }; },
    async mutateResource(path: string, method: string, body: unknown) {
      calls.push({ path, method, body });
      return { etag: '"shared-step-1:v1"', data: { id: "shared-step-1", projectId: "project-1",
        currentRevision: 1, current: { revision: 1, title: "Авторизация", items: [
          { id: "item-1", order: 1, action: "Войти", expectedResult: "Главная открыта",
            testData: "", required: true, attachmentIds: [] }], changeNote: "",
        createdBy: "identity-1", createdAt: now }, revisionCount: 1, archivedAt: null,
        createdAt: now, updatedAt: now } };
    },
  } as unknown as TmsHttpClient;

  await listSharedSteps(http, "project-1");
  const created = await createSharedStep(http, "project-1", { title: "Авторизация", items: [
    { id: "item-1", order: 1, action: "Войти", expectedResult: "Главная открыта",
      testData: "", required: true, attachmentIds: [] }], changeNote: "" });

  assert.equal(calls[0]?.path, "/projects/project-1/shared-steps?limit=100");
  assert.equal(calls[1]?.path, "/projects/project-1/shared-steps");
  assert.equal(calls[1]?.method, "POST");
  assert.equal(created.current.items[0]?.id, "item-1");
});
