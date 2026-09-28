import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { TmsSessionProvider, type TmsSessionIdentity } from "../../../auth/presentation/session/TmsSessionContext";
import { WorkspacePeopleProvider } from "../../../workspace/members/context/WorkspacePeopleContext";
import { TmsLocaleContext } from "../../../localization/context/TmsLocaleProvider";
import { useDocumentationCatalog } from "../useDocumentationCatalog";
import { visibleCitations } from "../../chat/model/citations";

Object.assign(globalThis, { React });
const cloud: TmsSessionIdentity = {
  kind: "cloud", subject: "cloud:owner", label: "Owner", workspaceId: "workspace-a",
  workspaceRole: "workspace_admin", signOut: async () => {},
};

function harness(session: TmsSessionIdentity, workspaceId: string, locale: "en" | "ru") {
  let catalog!: ReturnType<typeof useDocumentationCatalog>, tree!: ReactTestRenderer;
  function Probe() { catalog = useDocumentationCatalog(); return null; }
  function View() {
    return <TmsLocaleContext.Provider value={{ locale, languageTag: locale === "ru" ? "ru-RU" : "en-US", setLocale() {}, t: key => key }}>
      <TmsSessionProvider value={session}><WorkspacePeopleProvider workspaceId={workspaceId} offline={false}>
        <Probe />
      </WorkspacePeopleProvider></TmsSessionProvider>
    </TmsLocaleContext.Provider>;
  }
  act(() => { tree = create(<View />); });
  return {
    catalog: () => catalog,
    update: (next: TmsSessionIdentity, workspace: string) => act(() => { session = next; workspaceId = workspace; tree.update(<View />); }),
    unmount: () => act(() => tree.unmount()),
  };
}

for (const locale of ["en", "ru"] as const) {
  test(`${locale}: verified cloud owner can open administrative guide sources in the current workspace`, () => {
    const h = harness(cloud, "workspace-a", locale);
    try {
      const article = h.catalog().articleById.get("company-access");
      assert.ok(article);
      const citation = { articleId: article.id, sectionId: article.sections[0].id, title: "Provider title" };
      const sources = visibleCitations([citation], h.catalog().articleById);
      assert.equal(sources.length, 1);
      assert.equal(sources[0].title, article.title);
      h.update(cloud, "workspace-b");
      assert.equal(h.catalog().articleById.has("company-access"), false);
      assert.deepEqual(visibleCitations([citation], h.catalog().articleById), []);
    } finally { h.unmount(); }
  });
}

test("managed guide visibility follows verified role and scope, not an administration link", () => {
  const owner = { ...cloud, kind: "managed" as const, administrationPath: "/admin/" };
  const h = harness(owner, "workspace-a", "en");
  try {
    assert.equal(h.catalog().articleById.has("company-access"), true);
    for (const workspaceRole of ["qa_manager", "tester", "reporter", "viewer", null, undefined] as const) {
      h.update({ ...owner, workspaceRole }, "workspace-a");
      assert.equal(h.catalog().articleById.has("company-access"), false, String(workspaceRole));
    }
    h.update(owner, "workspace-b");
    assert.equal(h.catalog().articleById.has("company-access"), false);
    h.update({ ...owner, workspaceId: undefined }, "workspace-a");
    assert.equal(h.catalog().articleById.has("company-access"), false);
  } finally { h.unmount(); }
});

test("legacy administrator guide access remains available", () => {
  const h = harness({ kind: "admin", subject: "admin:legacy", label: "Administrator", signOut: async () => {} }, "workspace-a", "en");
  try { assert.equal(h.catalog().articleById.has("company-access"), true); }
  finally { h.unmount(); }
});
