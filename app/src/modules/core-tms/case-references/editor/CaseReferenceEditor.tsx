"use client";

import { addComposerChild$, realmPlugin, rootEditor$, useCellValue } from "@mdxeditor/editor";
import { useEffect } from "react";
import { useCaseReferences } from "../presentation/CaseReferenceProvider";
import { registerCaseReferences } from "./registerCaseReferences";
import { ProductDocEditorLinkHover } from "../../product-docs/presentation/draft/links/smart/ProductDocEditorLinkHover";

export function CaseReferenceEditor() {
  const editor = useCellValue(rootEditor$);
  const context = useCaseReferences();
  useEffect(() => {
    if (!editor || !context) return;
    return registerCaseReferences(editor, context, window.location.origin);
  }, [context, editor]);
  return null;
}

function CaseReferencesWithPreview() {
  return <><CaseReferenceEditor /><ProductDocEditorLinkHover blocked={false} /></>;
}

export const caseReferencesPlugin = realmPlugin<{ preview?: boolean }>({
  init(realm, options) { realm.pub(addComposerChild$, options?.preview ? CaseReferencesWithPreview : CaseReferenceEditor); },
});
