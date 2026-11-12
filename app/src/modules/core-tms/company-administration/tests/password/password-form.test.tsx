import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { AdministrationError, type PasswordChange, type Profile } from "../../domain/administration";
import { installSecurityControls } from "../support/security-controls";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const restoreControls = installSecurityControls();
const { ProfilePasswordForm } = require("../../presentation/profile/ProfilePasswordForm") as typeof import("../../presentation/profile/ProfilePasswordForm");
const { ErrorToast } = require("../../../presentation/common/error/ErrorToast") as typeof import("../../../presentation/common/error/ErrorToast");
restoreControls();
const profile: Profile = { id: "me", name: "Ada", login: "ada", email: "ada@test.example", emailVerified: true, phone: "", role: "tester", owner: false, hasAvatar: false, version: 3, mfaEnabled: true, emailChangeAvailable: false };
const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
const currentPassword = "synthetic-current-password", newPassword = "synthetic-new-password";
type Options = { password: AdministrationPort["password"]; mfa?: boolean; onSaved?: () => void; onPendingChange?: (value: boolean) => void };
async function setup(options: Options) {
  let view!: ReactTestRenderer;
  const client = { password: options.password } as AdministrationPort;
  await act(async () => { view = create(<TmsLocaleContext.Provider value={locale}>
    <ProfilePasswordForm profile={{ ...profile, mfaEnabled: options.mfa ?? true }} client={client}
      onSaved={options.onSaved ?? (() => {})} onPendingChange={options.onPendingChange}/>
  </TmsLocaleContext.Provider>); });
  const inputs = () => view.root.findAllByType("input");
  return { view, inputs,
    async fill(recovery = false) { await act(async () => {
      const [current, next, confirmation, code] = inputs().filter(input => input.props.type !== "checkbox");
      current.props.onChange({ target: { value: currentPassword } }); next.props.onChange({ target: { value: newPassword } });
      confirmation.props.onChange({ target: { value: newPassword } }); code?.props.onChange({ target: { value: recovery ? "synthetic-recovery" : "123456" } });
      if (recovery) inputs().find(input => input.props.type === "checkbox")!.props.onChange({ target: { checked: true } });
    }); },
    submit() { view.root.findByType("form").props.onSubmit({ preventDefault() {} }); },
    async dispose() { await act(async () => view.unmount()); },
  };
}

test("pending locks before transport, duplicate submissions stay singleflight, and success clears secrets", async () => {
  const events: string[] = [], changes: PasswordChange[] = []; let finish!: () => void, saved = 0;
  const h = await setup({ password: async payload => { events.push("transport"); changes.push(payload); await new Promise<void>(resolve => { finish = resolve; }); },
    onPendingChange: value => events.push(`pending:${value}`), onSaved: () => { events.push("saved"); saved++; } });
  try {
    await h.fill(); await act(async () => { h.submit(); h.submit(); });
    assert.deepEqual(events, ["pending:true", "transport"]); assert.equal(changes.length, 1);
    assert.deepEqual(changes[0], { currentPassword, newPassword, secondFactor: { kind: "totp", code: "123456" } });
    assert.ok(h.inputs().every(input => input.props.disabled));
    await act(async () => finish());
    assert.deepEqual(events, ["pending:true", "transport", "pending:false", "saved"]); assert.equal(saved, 1);
    assert.ok(h.inputs().filter(input => input.props.type !== "checkbox").every(input => input.props.value === ""));
    assert.equal(h.view.root.findAllByProps({ role: "status" }).length, 1);
  } finally { await h.dispose(); }
});

test("mismatched confirmation never starts a request or locks the parent", async () => {
  let calls = 0; const pending: boolean[] = [];
  const h = await setup({ password: async () => { calls++; }, onPendingChange: value => pending.push(value) });
  try {
    await h.fill(); await act(async () => h.inputs()[2].props.onChange({ target: { value: "different" } }));
    await act(async () => h.submit());
    assert.equal(calls, 0); assert.deepEqual(pending, []);
    assert.match(h.view.root.findByProps({ role: "alert" }).children.join(""), /Passwords do not match/);
  } finally { await h.dispose(); }
});

test("a failed request releases the parent lock, preserves retry inputs, and reports no success", async () => {
  const pending: boolean[] = []; let fail = true, saved = 0; const changes: PasswordChange[] = [];
  const h = await setup({ password: async payload => { changes.push(payload); if (fail) throw new AdministrationError("INVALID_INPUT"); },
    onPendingChange: value => pending.push(value), onSaved: () => saved++ });
  try {
    await h.fill(true); await act(async () => h.submit());
    assert.deepEqual(pending, [true, false]); assert.equal(saved, 0);
    assert.equal(h.inputs()[0].props.value, currentPassword); assert.equal(h.inputs()[3].props.value, "synthetic-recovery");
    assert.ok(h.view.root.findByType(ErrorToast).props.message);
    assert.deepEqual(changes[0], { currentPassword, newPassword, secondFactor: { kind: "recovery", code: "synthetic-recovery" } });
    fail = false; await act(async () => h.submit());
    assert.deepEqual(pending, [true, false, true, false]); assert.equal(saved, 1); assert.equal(changes.length, 2);
  } finally { await h.dispose(); }
});

test("without MFA or a pending listener the shared profile form keeps its original payload and success status", async () => {
  const changes: PasswordChange[] = []; const h = await setup({ password: async value => { changes.push(value); }, mfa: false });
  try {
    assert.equal(h.inputs().length, 3); await h.fill(); await act(async () => h.submit());
    assert.deepEqual(changes, [{ currentPassword, newPassword }]);
    assert.equal(h.view.root.findAllByProps({ role: "status" }).length, 1);
  } finally { await h.dispose(); }
});

test("unmount aborts the command and releases once; late completion cannot report another unlock or save", async () => {
  const pending: boolean[] = []; let finish!: () => void, signal!: AbortSignal, saved = 0;
  const h = await setup({ password: async (_payload, request) => { signal = request; await new Promise<void>(resolve => { finish = resolve; }); },
    onPendingChange: value => pending.push(value), onSaved: () => saved++ });
  await h.fill(); await act(async () => h.submit()); await h.dispose();
  assert.equal(signal.aborted, true); assert.deepEqual(pending, [true, false]);
  await act(async () => finish()); assert.deepEqual(pending, [true, false]); assert.equal(saved, 0);
});
