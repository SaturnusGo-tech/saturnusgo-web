import assert from "node:assert/strict";
import { test } from "node:test";
import { createTmsHttpClient } from "../../../../core/tms/transport/http";
import { rewriteText } from "../data/rewrite";
import { replaceWritingSelection } from "../model/target";

test("rewrite uses authenticated workspace transport and includes instruction only for custom actions", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const http = createTmsHttpClient({ apiBase: "https://falcon.example/api/v1", accessToken: async () => "synthetic-token", production: true,
    fetch: async (url, init) => { calls.push({ url: String(url), init: init! }); return new Response(JSON.stringify({ data: { markdown: "**Исправлено**" } })); } });
  const abort = new AbortController();
  assert.equal(await rewriteText(http, "workspace-a", "исправте", "correct", "unused", abort.signal), "**Исправлено**");
  assert.equal(calls[0].url, "https://falcon.example/api/v1/workspaces/workspace-a/ai/text-rewrite");
  assert.equal(new Headers(calls[0].init.headers).get("Authorization"), "Bearer synthetic-token");
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), { text: "исправте", action: "correct" });
  assert.equal(calls[0].init.signal, abort.signal);
  await rewriteText(http, "workspace-a", "", "custom", " Добавь сценарий ", abort.signal);
  assert.deepEqual(JSON.parse(String(calls[1].init.body)), { text: "", action: "custom", instruction: "Добавь сценарий" });
});

test("empty provider response cannot replace the source", async () => {
  const http = createTmsHttpClient({ apiBase: "https://falcon.example/api/v1", accessToken: async () => "synthetic-token", production: true,
    fetch: async () => new Response(JSON.stringify({ data: { markdown: " " } })) });
  await assert.rejects(() => rewriteText(http, "workspace-a", "source", "improve", "", new AbortController().signal));
});

test("scenario replacement uses captured offsets, preserving identical text elsewhere and all surrounding Markdown", () => {
  const source = "**GET** /users — ошибка; повтор: ошибка.\n```json\n{\"id\":42}\n```";
  const start = source.lastIndexOf("ошибка");
  assert.equal(replaceWritingSelection(source, source, start, start + 6, "проверка"), source.slice(0, start) + "проверка" + source.slice(start + 6));
  assert.equal(replaceWritingSelection(source, source + " edits", start, start + 6, "проверка"), null);
  assert.equal(replaceWritingSelection(source, source, -1, 3, "bad"), null);
  assert.equal(replaceWritingSelection("", "", 0, 0, "1. Проверить вход"), "1. Проверить вход");
});
