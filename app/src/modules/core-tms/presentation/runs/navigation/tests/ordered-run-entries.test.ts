import assert from "node:assert/strict";
import { test } from "node:test";
import { reconcileRunEntries } from "../order/reconcile-run-entries";
import { orderedRunEntries, nextRemainingEntry } from "../order/ordered-run-entries";
import { runRepositoryEntries } from "../../../../runs/batches/model/repository/run-repository";
import type { RunItemSummary } from "../../../../../../core/tms/contracts/legacy-contract";
const rows = runRepositoryEntries("r", "p", [
  {id:"parent",caseKey:"P-1",preview:{title:"Parent",folderPath:"/A"}},
  {id:"child",caseKey:"P-2",preview:{title:"Child",folderPath:"/A/B"}},
  {id:"root",caseKey:"P-3",preview:{title:"Root",folderPath:"/"}},
  {id:"archived",caseKey:"P-4",preview:{title:"Archived",folderPath:"/A/B"},archivedAt:"2026-01-01"},
] as RunItemSummary[]);
test("execution matches folder tree order and deduplicates repeated tag groups",()=>{
  const groups=[{id:"smoke",cases:rows.map(row=>row.testCase)},{id:"regression",cases:[rows[1].testCase]}];
  assert.deepEqual(orderedRunEntries("w",groups,rows,false).map(row=>row.item.id),["child","parent","root"]);
  assert.deepEqual(orderedRunEntries("w",groups,rows,true).map(row=>row.item.id),["child","archived","parent","root"]);
});
test("advancing skips removed filter matches without wrapping after the final case",()=>{
  assert.equal(nextRemainingEntry(rows,"parent",[rows[2]])?.item.id,"root");
  assert.equal(nextRemainingEntry(rows,"root",[rows[0],rows[3]]),undefined);
});


test("a saved result survives project navigation but a newer server version wins",()=>{
  const cache=new Map(); const server=rows.map(row=>({...row,item:{...row.item,rowVersion:1,status:"not_run" as const}}));
  const confirmed={...server[0].item,rowVersion:2,status:"passed" as const};
  assert.equal(reconcileRunEntries(server,[confirmed],cache)[0].item.status,"passed");
  assert.equal(reconcileRunEntries(server,[],cache)[0].item.status,"passed");
  const refreshed=server.map((row,index)=>index?row:{...row,item:{...row.item,rowVersion:3,status:"failed" as const}});
  assert.equal(reconcileRunEntries(refreshed,[confirmed],cache)[0].item.status,"failed");
  assert.equal(reconcileRunEntries(refreshed,[],cache)[0].item.status,"failed");
});

test("a detail response without preview preserves the repository folder and title",()=>{
  const cache=new Map();const base={...rows[0],item:{...rows[0].item,rowVersion:1}};
  const confirmed={...base.item,preview:undefined,rowVersion:2,status:"passed" as const};
  const merged=reconcileRunEntries([base],[confirmed],cache)[0];
  assert.equal(merged.testCase.folderPath,"/A");assert.equal(merged.testCase.title,"Parent");
  assert.equal(merged.item.status,"passed");
});
