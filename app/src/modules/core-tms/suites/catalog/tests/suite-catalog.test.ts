import assert from "node:assert/strict";
import test from "node:test";
import type { Suite, SuiteSummary } from "../../../../../core/tms/contracts/legacy-contract";
import { filterSuiteCatalog, suiteCatalogCount } from "../suite-catalog";
const sample = (patch: Partial<SuiteSummary> = {}): SuiteSummary => ({ id: "suite-a", projectId: "project-a", key: "HOST-1", name: "Смоук релиза", description: "Оплата и авторизация", type: "static", caseCount: 3, status: "active", createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-09-09T10:00:00Z", ...patch });
test("catalog search combines normalized words across names, descriptions and keys", () => {
 const input = [sample(), sample({id:"suite-b",name:"Регрессия",description:"Весь продукт",key:"HOST-2"})];
 assert.deepEqual(filterSuiteCatalog(input,"  РЕЛИЗА  оплата ","all","updated","ru").map(s=>s.id),["suite-a"]);
 assert.deepEqual(filterSuiteCatalog(input,"host-2","all","updated","en").map(s=>s.id),["suite-b"]);
 assert.equal(filterSuiteCatalog(input,"оплата missing","all","updated","ru").length,0);
});
test("composition filtering works independently of query and sorting", () => {
 const input = [sample(),sample({id:"suite-b",type:"dynamic"})];
 assert.deepEqual(filterSuiteCatalog(input,"","dynamic","updated","ru").map(s=>s.id),["suite-b"]);
 assert.deepEqual(filterSuiteCatalog(input,"","static","updated","ru").map(s=>s.id),["suite-a"]);
 assert.equal(filterSuiteCatalog(input," ","all","name","ru").length,2);
});
test("sort is immutable, stable and numeric for suite names", () => {
 const input = Object.freeze([sample({id:"suite-b",name:"Suite 10",createdAt:"2026-09-02T10:00:00Z"}),sample({id:"suite-a",name:"Suite 2"})]);
 assert.deepEqual(filterSuiteCatalog(input,"","all","name","en").map(s=>s.id),["suite-a","suite-b"]);
 assert.deepEqual(filterSuiteCatalog(input,"","all","updated","en").map(s=>s.id),["suite-a","suite-b"]);
 assert.deepEqual(filterSuiteCatalog(input,"","all","created","en").map(s=>s.id),["suite-b","suite-a"]);
 assert.equal(input[0].id,"suite-b");
});
test("tag-based summary zero is unknown until the matching detail resolves it", () => {
 const dynamic = sample({type:"dynamic",caseCount:0});
 const detail: Suite = {...dynamic,caseIds:[],filter:{tags:["smoke"]},resolvedCaseCount:24};
 assert.equal(suiteCatalogCount(dynamic,null),null);
 assert.equal(suiteCatalogCount(dynamic,detail),24);
 assert.equal(suiteCatalogCount(dynamic,{...detail,resolvedCaseCount:0}),0);
 assert.equal(suiteCatalogCount(dynamic,{...detail,id:"suite-other"}),null);
 assert.equal(suiteCatalogCount(dynamic,{...detail,projectId:"project-other"}),null);
 assert.equal(suiteCatalogCount(sample({caseCount:0}),detail),0);
});
test("resolved static scope excludes archived members after hydration", () => {
 const suite = sample({caseCount:2});
 const detail: Suite = {...suite,caseIds:["active","archived"],filter:{},resolvedCaseCount:1};
 assert.equal(suiteCatalogCount(suite,null),2);
 assert.equal(suiteCatalogCount(suite,detail),1);
 assert.equal(suiteCatalogCount(suite,{...detail,resolvedCaseCount:0}),0);
 assert.equal(suiteCatalogCount(suite,{...detail,updatedAt:"2026-09-08T10:00:00Z"}),2);
});
