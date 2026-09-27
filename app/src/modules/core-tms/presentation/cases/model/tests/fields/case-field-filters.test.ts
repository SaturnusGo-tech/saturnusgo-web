import assert from "node:assert/strict";
import test from "node:test";
import { caseFieldOptions, fieldFilterCount, matchesFieldFilters } from "../../fields/case-field-filters";
import { caseSearchValues, matchesCaseQuery } from "../../query/match";
import { parseCaseQuery } from "../../query/parse";
import type { TestCaseSummary } from "../../../../../../../core/tms/contracts/legacy-contract";
const item:TestCaseSummary={id:"c",projectId:"p",key:"P-1",folderPath:"/Smoke",currentRevision:1,title:"Checkout",type:"manual",lifecycle:"ready",priority:"high",component:"Payments",ownerIdentityId:null,tags:[],estimatedMinutes:1,revisionCount:1,archivedAt:null,createdAt:"",updatedAt:"",etag:"",productGroupId:"g1",productId:"p1",regression:false,
 customFields:[{fieldId:"f",systemKey:"product",name:"Product",type:"string",values:[{id:"p1",label:"Payments",value:"Payments",parentValueId:"g1"}]}]};
test("identity filters distinguish same-named products and false is not an all filter",()=>{
 assert.equal(matchesFieldFilters(item,{products:["p2"]}),false);
 assert.equal(matchesFieldFilters(item,{products:["p1"],productGroups:["g1"],regression:false}),true);
 assert.equal(matchesFieldFilters(item,{regression:true}),false);assert.equal(fieldFilterCount({regression:false}),1);
});
test("options keep stable distinct identities even when names match",()=>{
 const other={...item,productId:"p2",customFields:item.customFields!.map(f=>({...f,values:f.values.map(v=>({...v,id:"p2"}))}))};
 assert.deepEqual(caseFieldOptions([item,other]).products?.map(o=>o.id),["p1","p2"]);
});
test("QL addresses product by name or ID and explicit regression false",()=>{
 const values=caseSearchValues({testCase:item,folderPath:item.folderPath});
 for(const query of ['product:"Payments" AND regression:false','product:p1']) {const parsed=parseCaseQuery(query);assert.equal(parsed.error,undefined);assert.equal(matchesCaseQuery(parsed.root,values),true);}
 assert.equal(matchesCaseQuery(parseCaseQuery("regression:true").root,values),false);
});
