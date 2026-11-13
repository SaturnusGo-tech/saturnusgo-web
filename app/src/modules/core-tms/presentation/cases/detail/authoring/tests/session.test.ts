import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../../../portfolios/tests/support/component-harness";
import { createEmptyRevision } from "../../../../../helpers/cases/caseRevision";
import type { CaseInspectorEditor } from "../../../inspector/model";

test("case authoring treats prefilled and reverted content as clean, but protects edits, placement and files", () => {
  const h = componentHarness();
  let registration: { id: string; dirty: boolean; busy?: boolean; revision?: string } | undefined;
  const module = h.load<{ useCaseAuthoringSession: (editor?: CaseInspectorEditor, files?: unknown[]) => unknown }>(
    new URL("../useCaseAuthoringSession.ts", import.meta.url), name => {
      if (name.endsWith("useAuthoringSession")) return { useAuthoringSession: (next: typeof registration) => {
        registration = next; return { release() {} };
      } };
    });
  const value = { ...createEmptyRevision(), title: "Existing coverage" };
  let editor = { mode: "edit", value, folderPath: "/Payments", documentation: { value: [{ docId: "existing" }] } } as unknown as CaseInspectorEditor;
  const render = (files: unknown[] = []) => h.render(() => module.useCaseAuthoringSession(editor, files));
  render(); assert.equal(registration?.dirty, false, "opening an existing revision does not edit it");
  const id = registration!.id;
  editor = { ...editor, value: { ...value, description: "Unsaved description" } };
  render(); assert.equal(registration?.dirty, true);
  const firstRevision = registration?.revision;
  render(); assert.equal(registration?.revision, firstRevision);
  editor = { ...editor, value: { ...value, description: "More unsaved text" } };
  render(); assert.notEqual(registration?.revision, firstRevision);
  editor = { ...editor, value: { ...value } };
  render(); assert.equal(registration?.dirty, false, "reverting the edit removes the warning");
  editor = { ...editor, folderPath: "/Billing" };
  render(); assert.equal(registration?.dirty, true);
  editor = { ...editor, folderPath: "/Payments" };
  render([{}]); assert.equal(registration?.dirty, true, "an attachment alone is unsaved work");
  render(); assert.equal(registration?.dirty, false);
  assert.equal(registration?.id, id, "metadata updates cannot create a new editor session");
  editor = { ...editor, submitting: true }; render(); assert.equal(registration?.busy, true);
  editor = { ...editor, submitting: false, attachmentsPending: true }; render();
  assert.equal(registration?.dirty, true, "partial save recovery remains protected");
  h.dispose();
});

test("a later create session uses a fresh baseline and guard identity", () => {
  const h = componentHarness(); let registration: { id: string; dirty: boolean } | undefined;
  const module = h.load<{ useCaseAuthoringSession: (editor?: CaseInspectorEditor, files?: unknown[]) => unknown }>(
    new URL("../useCaseAuthoringSession.ts", import.meta.url), name => name.endsWith("useAuthoringSession")
      ? { useAuthoringSession: (next: typeof registration) => { registration = next; return { release() {} }; } } : undefined);
  const first = { mode: "create", value: createEmptyRevision(), folderPath: "/Prefilled" } as CaseInspectorEditor;
  h.render(() => module.useCaseAuthoringSession(first)); const id = registration!.id;
  assert.equal(registration?.dirty, false);
  h.render(() => module.useCaseAuthoringSession(undefined));
  h.render(() => module.useCaseAuthoringSession({ ...first, value: createEmptyRevision(), folderPath: "/Other" }));
  assert.notEqual(registration?.id, id); assert.equal(registration?.dirty, false);
  h.dispose();
});
