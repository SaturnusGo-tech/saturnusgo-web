import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { maximumRecordingSeconds } from "../../model/audio";

const require = createRequire(import.meta.url);
const module = { exports: {} as { RecordingStatus: React.ComponentType<{ elapsed: number; level: number; ru: boolean }> } };
const source = readFileSync(new URL("../../presentation/RecordingStatus.tsx", import.meta.url), "utf8");
runInNewContext(ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX,
} }).outputText, { module, exports: module.exports, require(name: string) {
  if (name === "react/jsx-runtime") return require(name);
  if (name.endsWith(".css")) return { default: {} };
  if (name.endsWith("model/audio")) return { maximumRecordingSeconds };
  throw new Error(`Unexpected import ${name}`);
} });
const render = (elapsed: number, level = 0, ru = true) => renderToStaticMarkup(
  React.createElement(module.exports.RecordingStatus, { elapsed, level, ru }));

test("recording time advances within the first second and carries correctly across a minute", () => {
  assert.match(render(.1), />0:00\.1</);
  assert.match(render(.7), />0:00\.7</);
  assert.match(render(59.9), />0:59\.9</);
  assert.match(render(60), />1:00\.0</);
  assert.match(render(300), />5:00\.0</);
  assert.match(render(.1), /role="timer" aria-live="off"/);
});

test("silence has no active meter bars; the displayed level follows supplied microphone samples", () => {
  const silence = render(2, 0);
  assert.match(silence, /aria-valuenow="0"/);
  assert.doesNotMatch(silence, /data-active/);
  const speech = render(2, .63, false);
  assert.match(speech, /aria-label="Microphone level"/);
  assert.match(speech, /aria-valuemin="0" aria-valuemax="100" aria-valuenow="63"/);
  assert.equal(speech.match(/data-active="true"/g)?.length, 4);
  assert.match(speech, />Recording</);
});

test("invalid or out-of-range display inputs cannot show negative time or a false high audio level", () => {
  assert.match(render(-5, Number.NaN), />0:00\.0</);
  assert.match(render(-5, Number.NaN), /aria-valuenow="0"/);
  assert.match(render(301, 2), />5:00\.0</);
  assert.match(render(301, 2), /aria-valuenow="100"/);
});
