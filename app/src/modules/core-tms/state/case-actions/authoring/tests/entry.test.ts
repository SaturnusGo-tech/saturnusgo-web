import assert from "node:assert/strict";
import test from "node:test";
import { componentHarness } from "../../../../portfolios/tests/support/component-harness";
import { createEmptyRevision } from "../../../../helpers/cases/caseRevision";
import type { useCaseActions } from "../../useCaseActions";

test("starting another case or revision defers the entire editor replacement until leave is approved", () => {
  for (const kind of ["create", "edit"] as const) {
    const h = componentHarness(undefined, { structuredClone });
    const changes: string[] = [];
    let intent: (() => void) | undefined;
    const module = h.load<{ useCaseActions: typeof useCaseActions }>(new URL("../../useCaseActions.ts", import.meta.url), name => {
      if (name.endsWith("authoring-leave")) return { requestAuthoringLeave: (action: () => void) => { intent = action; return Promise.resolve(false); } };
      if (name.endsWith("useCaseDocumentation")) return { useCaseDocumentation: () => ({ fields: {}, reset: () => changes.push("docs") }) };
      if (name.endsWith("TmsHttpClientContext")) return { useTmsHttpClient: () => ({}) };
      if (name.endsWith("AttachmentClientProvider")) return { useAttachmentClient: () => ({}) };
      if (name.endsWith("useTmsLocale")) return { useTmsLocale: () => ({ locale: "en" }) };
      if (name.endsWith("caseRevision")) return { createEmptyRevision };
    });
    const state = { isCaseSubmitting: () => false, selectedFolder: "/Payments",
      setCaseDraft: () => changes.push("draft"), setCaseFolderPath: () => changes.push("folder"),
      setEditing: () => changes.push("mode"), setDialog: () => changes.push("dialog") };
    const actions = h.render(() => module.useCaseActions(state as never,
      { selectedRevision: createEmptyRevision(), selectedCase: { folderPath: "/Existing" } } as never, () => {}));
    if (kind === "create") actions.openNewCase(); else actions.openEditCase();
    assert.deepEqual(changes, [], `${kind}: Stay must retain the existing draft and its placement`);
    assert.ok(intent, `${kind}: replacement must request one leave decision`);
    intent(); assert.deepEqual(changes, ["docs", "draft", "folder", "mode", "dialog"]);
    h.dispose();
  }
});
