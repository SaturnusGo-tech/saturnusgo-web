import assert from "node:assert/strict";
import { test } from "node:test";
import { act } from "react-test-renderer";
import { hookHarness, target } from "./hook-harness";
import { result } from "../harness";

for (const prefixed of [false, true]) {
  test(`recognition requires a click and supports the ${prefixed ? "prefixed" : "standard"} browser API`, (t) => {
    const h = hookHarness(t, { prefixed, text: "Перепиши" });
    assert.equal(h.instances.length, 0);
    assert.equal(h.get().active, false);
    const recognition = h.start();
    assert.equal(recognition.starts, 1);
    assert.equal(recognition.lang, "ru-RU");
    act(() => recognition.onstart?.());
    act(() => recognition.onresult?.(result([["корректнее", true]])));
    act(() => recognition.onend?.());
    assert.equal(h.text(), "Перепиши корректнее");
    assert.equal(h.get().active, false);
    assert.equal(h.applied(), 0);
    assert.equal(h.networkCalls(), 0);
  });
}

test("interim words are replaced, finalized words are preserved, and repeat sessions append once", (t) => {
  const h = hookHarness(t, { text: "Уточни" });
  const first = h.start(); act(() => first.onstart?.());
  act(() => first.onresult?.(result([["шаг", false]])));
  assert.equal(h.text(), "Уточни шаг");
  act(() => first.onresult?.(result([["шаги", true], ["сце", false]], 1)));
  assert.equal(h.text(), "Уточни шаги сце");
  act(() => first.onresult?.(result([["шаги", true], ["сценария", true]], 1)));
  act(() => first.onend?.());
  const second = h.start(); act(() => second.onstart?.());
  act(() => second.onresult?.(result([["и оформи Markdown", true]])));
  act(() => second.onend?.());
  assert.equal(h.text(), "Уточни шаги сценария и оформи Markdown");
  assert.equal(h.applied(), 0);
  assert.equal(h.networkCalls(), 0);
});

test("cancel preserves typed and confirmed text and rejects all late results", (t) => {
  const h = hookHarness(t, { text: "Typed command" });
  const recognition = h.start(); act(() => recognition.onstart?.());
  act(() => recognition.onresult?.(result([["confirmed", true], ["uncertain", false]])));
  const lateResult = recognition.onresult, lateError = recognition.onerror;
  act(() => h.get().cancel());
  assert.equal(h.text(), "Typed command confirmed");
  assert.equal(recognition.aborts, 1);
  act(() => { lateResult?.(result([["Late text", true]])); lateError?.({ error: "network" }); });
  assert.equal(h.text(), "Typed command confirmed");
  assert.equal(h.get().error, "");
});

test("permission errors preserve a typed command and remain visible after returning to idle", (t) => {
  const h = hookHarness(t, { text: "Не потеряй команду" });
  const recognition = h.start();
  act(() => recognition.onerror?.({ error: "not-allowed" }));
  assert.equal(h.text(), "Не потеряй команду");
  assert.equal(h.get().state, "idle");
  assert.match(h.get().error, /микрофон/i);
  assert.equal(recognition.aborts, 1);
});

for (const [name, update] of [
  ["disabled", { enabled: false }], ["workspace", { workspaceId: "workspace-b" }],
  ["target", { target: target() }], ["language", { ru: false }],
] as const) {
  test(`${name} change stops capture, removes interim text, and rejects a stale callback`, (t) => {
    const h = hookHarness(t, { text: "Typed" });
    const recognition = h.start(); act(() => recognition.onstart?.());
    act(() => recognition.onresult?.(result([["confirmed", true], ["uncertain", false]])));
    const late = recognition.onresult;
    h.update(update);
    assert.equal(recognition.aborts, 1);
    assert.equal(h.get().state, "idle");
    assert.equal(h.text(), "Typed confirmed");
    act(() => late?.(result([["Wrong context", true]])));
    assert.equal(h.text(), "Typed confirmed");
  });
}

test("unmount aborts a pending permission request without publishing new text", (t) => {
  const h = hookHarness(t, { text: "Preserved" });
  const recognition = h.start(), lateStart = recognition.onstart, lateResult = recognition.onresult;
  h.unmount();
  const count = h.changes.length;
  act(() => { lateStart?.(); lateResult?.(result([["Stale", true]])); });
  assert.equal(recognition.aborts, 1);
  assert.equal(h.changes.length, count);
});

test("hiding the page stops the microphone and keeps only confirmed dictation", (t) => {
  const h = hookHarness(t, { text: "Typed" });
  const recognition = h.start(); act(() => recognition.onstart?.());
  act(() => recognition.onresult?.(result([["done", true], ["draft", false]])));
  act(() => { h.document.hidden = true; h.document.dispatchEvent(new Event("visibilitychange")); });
  assert.equal(recognition.aborts, 1);
  assert.equal(h.text(), "Typed done");
});

test("the limit also applies to recognition results and stops capture at 2000 characters", (t) => {
  const h = hookHarness(t, { text: "x".repeat(1995) });
  const recognition = h.start(); act(() => recognition.onstart?.());
  act(() => recognition.onresult?.(result([["more speech", true]])));
  assert.equal(h.text().length, 2000);
  assert.equal(recognition.stops, 1);
  assert.equal(h.get().state, "stopping");
  assert.match(h.get().error, /2000/);
  act(() => recognition.onend?.());
  assert.equal(h.text(), `${"x".repeat(1995)} more`);
  h.start();
  assert.equal(h.instances.length, 1);
});

for (const mode of ["unavailable", "insecure", "disabled"] as const) {
  test(`${mode} speech does not create capture and keeps manual text`, (t) => {
    const h = hookHarness(t, { text: "Manual", [mode]: true, ...(mode === "disabled" ? { config: { enabled: false } } : {}) });
    h.start();
    assert.equal(h.instances.length, 0);
    assert.equal(h.text(), "Manual");
    assert.equal(h.get().state, "idle");
    assert.equal(h.networkCalls(), 0);
  });
}
