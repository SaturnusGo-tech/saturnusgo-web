import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import type { AdministrationPort } from "../../application/ports/administration-port";
import { AdministrationError, type Profile, type PasswordChange } from "../../domain/administration";

(globalThis as typeof globalThis & { React: typeof React }).React = React;
const previousCss = require.extensions[".css"];
require.extensions[".css"] = module => { module.exports = {}; };
const { ProfilePage } = require("../../presentation/profile-page/ProfilePage") as typeof import("../../presentation/profile-page/ProfilePage");
const { ProfileDetailsForm } = require("../../presentation/profile/ProfileDetailsForm") as typeof import("../../presentation/profile/ProfileDetailsForm");
const { ProfilePasswordForm } = require("../../presentation/profile/ProfilePasswordForm") as typeof import("../../presentation/profile/ProfilePasswordForm");
if (previousCss) require.extensions[".css"] = previousCss; else delete require.extensions[".css"];
const profile: Profile = { id: "me", name: "Ada", login: "ada", email: "ada@test.example", emailVerified: true, phone: "", role: "tester", owner: false, hasAvatar: false, version: 3, mfaEnabled: true, emailChangeAvailable: false };
const locale = { locale: "en" as const, languageTag: "en-US" as const, setLocale() {}, t: () => "" };
const wrap = (content: React.ReactNode) => <TmsLocaleContext.Provider value={locale}>{content}</TmsLocaleContext.Provider>;
const submit = async (view: ReactTestRenderer) => act(async () => { view.root.findByType("form").props.onSubmit({ preventDefault() {} }); });

test("profile save retains field constraints, sends edits and reports an unsuccessful save", async () => {
  let saved = 0, denied = false;
  const updates: unknown[] = [];
  const client = { updateProfile: async (...args: unknown[]) => { updates.push(args.slice(0, 2)); if (denied) throw new AdministrationError("INVALID_INPUT"); } } as unknown as AdministrationPort;
  let view!: ReactTestRenderer;
  await act(async () => { view = create(wrap(<ProfileDetailsForm profile={profile} client={client} onSaved={() => saved++} />)); });
  try {
    const [name, phone] = view.root.findAllByType("input");
    assert.equal(name.props.required, true); assert.equal(name.props.maxLength, 200);
    assert.equal(phone.props.type, "tel"); assert.equal(phone.props.pattern, "[+][1-9][0-9]{7,14}|");
    await act(async () => { name.props.onChange({ target: { value: "Ada Lovelace" } }); phone.props.onChange({ target: { value: "+77011234567" } }); });
    await submit(view);
    assert.deepEqual(updates[0], [profile, { name: "Ada Lovelace", phone: "+77011234567" }]); assert.equal(saved, 1);
    denied = true; await submit(view);
    assert.equal(saved, 1); assert.equal(view.root.findAllByProps({ role: "alert" }).length, 1);
  } finally { await act(async () => view.unmount()); }
});

test("password confirmation blocks a mismatch and preserves MFA authorization on submission", async () => {
  const changes: PasswordChange[] = []; let saved = 0, view!: ReactTestRenderer;
  const client = { password: async (change: PasswordChange) => { changes.push(change); } } as unknown as AdministrationPort;
  await act(async () => { view = create(wrap(<ProfilePasswordForm profile={profile} client={client} onSaved={() => saved++} />)); });
  try {
    const [current, next, confirmation, code, recovery] = view.root.findAllByType("input");
    assert.equal(current.props.autoComplete, "current-password"); assert.equal(next.props.minLength, 12); assert.equal(next.props.maxLength, 128);
    await act(async () => { current.props.onChange({ target: { value: "current-example" } }); next.props.onChange({ target: { value: "new-example-password" } }); confirmation.props.onChange({ target: { value: "different-example" } }); });
    await submit(view); assert.equal(changes.length, 0); assert.equal(saved, 0);
    assert.match(view.root.findByProps({ role: "alert" }).children.join(""), /Passwords do not match/);
    await act(async () => { confirmation.props.onChange({ target: { value: "new-example-password" } }); code.props.onChange({ target: { value: "recovery-example" } }); recovery.props.onChange({ target: { checked: true } }); });
    await submit(view);
    assert.deepEqual(changes, [{ currentPassword: "current-example", newPassword: "new-example-password", secondFactor: { kind: "recovery", code: "recovery-example" } }]);
    assert.equal(saved, 1); assert.equal(view.root.findAllByProps({ role: "status" }).length, 1);
    assert.ok(view.root.findAllByType("input").filter(input => input.props.type !== "checkbox").every(input => input.props.value === ""));
  } finally { await act(async () => view.unmount()); }
});

test("the sessions destination renders inline and revokes only a selected non-current session", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window"), events = new EventTarget();
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location: new URL("https://tenant.test/profile/#sessions"), addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) } });
  const revoked: string[] = []; let view!: ReactTestRenderer;
  const client = { profile: async () => profile,
    sessions: async () => ({ items: [{ id: "current", current: true, userAgent: "This device", createdAt: "2026-11-04T09:00:00Z" }, ...revoked.length ? [] : [{ id: "old", current: false, userAgent: "Other browser", createdAt: "2026-11-03T09:00:00Z" }]], nextCursor: null }),
    revokeSession: async (id: string) => { revoked.push(id); },
  } as unknown as AdministrationPort;
  try {
    await act(async () => { view = create(wrap(<ProfilePage client={client} />)); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    assert.equal(view.root.findAllByProps({ role: "dialog" }).length, 0);
    assert.equal(view.root.findAllByType("h1")[0].children.join(""), "Devices and sessions");
    const revoke = view.root.findAllByType("button").filter(button => button.children.includes("End session"));
    assert.equal(revoke.length, 1);
    await act(async () => { revoke[0].props.onClick(); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    assert.deepEqual(revoked, ["old"]);
    assert.equal(view.root.findAllByType("button").filter(button => button.children.includes("End session")).length, 0);
  } finally {
    await act(async () => view?.unmount());
    if (previous) Object.defineProperty(globalThis, "window", previous); else Reflect.deleteProperty(globalThis, "window");
  }
});
