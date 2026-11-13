import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyRevision } from "../../../../../helpers/cases/caseRevision";
import { copyInspectorRevision, restoreInspectorSection } from "../../model";
import { updateCaseField } from "../case-field-selection";
import type { CustomFieldDefinition } from "../../../../../custom-fields/model/custom-field";
const field = (id:string, systemKey:CustomFieldDefinition["systemKey"]):CustomFieldDefinition => ({ id,systemKey,name:id,identifier:id,type:"string",multiple:false,required:false,
  workspaceId:"w",projectId:"p",parentFieldId:null,archivedAt:null,rowVersion:1,createdAt:"2026-09-27",updatedAt:"2026-09-27",updatedBy:null });
const group=field("group","product_group"), product=field("product","product"), regression={...field("regression","regression"),type:"boolean" as const};
const value = (id:string,parentValueId:string|null=null) => ({ id,label:id,value:id,parentValueId });
test("changing product group clears only the incompatible product and retains other fields",()=>{
  let revision=createEmptyRevision();
  for(const [f,v] of [[group,[value("g1")]], [product,[value("p1","g1")]], [field("number",null),[value("n")]]] as const) revision={...revision,...updateCaseField(revision,f,v)};
  const next=updateCaseField(revision,group,[value("g2")]);
  assert.equal(next.productId,null);assert.equal(next.component,"");assert.equal(next.productGroupId,"g2");
  assert.deepEqual(next.customFields?.find(f=>f.fieldId==="product")?.values,[]);
  assert.equal(next.customFields?.find(f=>f.fieldId==="number")?.values[0].id,"n");
  assert.equal(revision.productId,"p1");
});
test("explicit regression false remains an ID selection, not a missing boolean",()=>{
  const next=updateCaseField(createEmptyRevision(),regression,[{id:"no",value:false,label:"false",parentValueId:null}]);
  assert.equal(next.regression,false);assert.equal(next.customFields?.[0].values[0].id,"no");
});
test("selecting an explicitly unclassified product clears its incompatible group without changing the product parent", () => {
  const base = createEmptyRevision();
  const grouped = { ...base, ...updateCaseField(base, group, [value("whole-product")]) };
  const next = updateCaseField(grouped, product, [value("Deep Links")]);
  assert.equal(next.productGroupId, null);
  assert.equal(next.productId, "Deep Links");
  assert.equal(next.component, "Deep Links");
  assert.deepEqual(next.customFields?.find(item => item.systemKey === "product_group")?.values, []);
  assert.equal(next.customFields?.find(item => item.systemKey === "product")?.values[0].parentValueId, null);
  assert.equal(grouped.productGroupId, "whole-product");
});
test("changing a saved value preserves its position in the snapshot", () => {
  const platform = field("platform", null);
  const channel = field("channel", null);
  const initial = createEmptyRevision();
  const first = { ...initial, ...updateCaseField(initial, platform, [value("web")]) };
  const revision = { ...first, ...updateCaseField(first, channel, [value("release")]) };
  const next = updateCaseField(revision, platform, [value("desktop")]);
  assert.deepEqual(next.customFields?.map(item => [item.fieldId, item.values[0].id]), [
    ["platform", "desktop"],
    ["channel", "release"],
  ]);
});
test("cancelling field edits restores immutable values and preserves another edited section",()=>{
  const original={...createEmptyRevision(),...updateCaseField(createEmptyRevision(),product,[value("legacy")])};
  const saved=copyInspectorRevision(original); original.customFields![0].values[0].label="Changed label";
  const restored=restoreInspectorSection({...original,description:"New description",productId:null},saved,"component");
  assert.equal(restored.customFields?.[0].values[0].label,"legacy");assert.equal(restored.productId,"legacy");assert.equal(restored.description,"New description");
});
