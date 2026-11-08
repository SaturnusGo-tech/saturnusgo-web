import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
export function loadFieldComponent(path: string, name: string, catalog: readonly unknown[] = []) {
  const module = { exports: {} as Record<string, React.ComponentType<any>> };
  const stub = (type: string) => (props: any) => React.createElement(type, props, props.children);
  runInNewContext(ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module, exports: module.exports, require(importName: string) {
    if (importName === "react") return React;
    if (importName === "react/jsx-runtime") return jsxRuntime;
    if (importName.endsWith(".css")) return { default: new Proxy({}, { get: (_, key) => String(key) }) };
    if (importName.endsWith("WorkspacePeopleContext")) return { useWorkspacePeople: () => ({ workspaceId: "workspace", offline: false }) };
    if (importName.endsWith("useCustomFieldCatalog")) return { useCustomFieldCatalog: () => ({ items: catalog, loading: false }) };
    if (importName.endsWith("field-labels")) return { customFieldLabel: (field: any) => field.name, customValueLabel: (value: any) => value.label };
    if (importName.endsWith("CustomFieldPicker")) return { CustomFieldPicker: stub("custom-picker"), CustomFieldIcon: stub("custom-field-icon") };
    if (importName.endsWith("MarkdownField")) return { MarkdownField: stub("markdown-field") };
    if (importName.endsWith("InspectorFieldValue")) return { InspectorFieldValue: stub("field-value") };
    if (importName.endsWith("useMemberName")) return { useMemberName: () => ({ name: null, loading: false }) };
    if (importName.endsWith("caseRevision") && name === "InspectorDetails") return { normalizeRevisionTags: (tags: string[]) => tags };
    if (importName.endsWith("ResponsibleName")) return { ResponsibleName: stub("responsible-name") };
    if (importName.endsWith("CaseAuthor")) return { CaseAuthor: stub("case-author") };
    if (importName.endsWith("PropertySelect")) return { PropertySelect: stub("property-select"), PropertyValue: stub("field-value") };
    if (importName.endsWith("PriorityField")) return { PriorityField: stub("priority-field") };
    if (importName.endsWith("PropertyAssigneeField")) return { PropertyAssigneeField: stub("responsible-picker") };
    if (importName.endsWith("PropertyLabelField")) return { PropertyLabelField: stub("label-field"), PropertyLabelTokens: stub("label-tokens") };
    return new Proxy({}, { get: (_, key) => stub(String(key)) });
  }});
  return module.exports[name];
}
