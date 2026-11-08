import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyRevision } from "../../../../../helpers/cases/caseRevision";
import { pastedCaseDocLinks } from "../pasted-case-doc-links";

test("only authored documentation links in the current project become requirements", () => {
  const scope = {workspaceId: "w", projectId: "p"};
  const href = "https://falcon.example/work/";
  const url = (id: string) => href + `?workspaceId=w&projectId=p&view=product-docs&docId=${id}`;
  const revision = {
    ...createEmptyRevision(),
    description: [
      `Reference [the rule][rule] and inspect (${url("bare")}).`,
      "",
      `[rule]: ${url("rule")}&docVersion=3&docSection=checkout`,
      `[unused]: ${url("unused")}`,
      "",
      `![Image alt](${url("image")})`,
      `Use \`${url("inline-code")}\` as a fixture`,
      "",
      "\x60\x60\x60",
      url("code-block"),
      "\x60\x60\x60",
      "",
      `[Another project](${url("wrong-project").replace("projectId=p", "projectId=other")})`,
      `[Malformed section](${url("wrong-section")}&docSection=%20)`,
    ].join("\n"),
    testData: `<${url("data")}>`,
    changeNote: url("note"),
    checklist: [{id: "item", order: 1, text: `[Verify](${url("rule")}&docVersion=3&docSection=checkout)`, required: true}],
  };
  assert.deepEqual(pastedCaseDocLinks(revision, href, scope), [
    {docId: "rule", version: 3, sectionId: "checkout"}, {docId: "bare"}, {docId: "data"}, {docId: "note"},
  ]);
});
