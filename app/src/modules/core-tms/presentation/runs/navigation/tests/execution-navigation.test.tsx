import assert from "node:assert/strict";
import { test } from "node:test";
import React, { useState } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { useRunExecutionNavigation } from "../state/useRunExecutionNavigation";
import type { WorkspaceModel } from "../../../../state/model/useWorkspaceModel";
import type { RunRepositoryModel } from "../../repository/state/useRunRepository";
import type { RunRepositoryEntry } from "../../../../runs/batches/model/repository/run-repository";

const entry = (id: string, project = "p"): RunRepositoryEntry => ({ runId: `run-${project}`, projectId: project,
  item: { id, archivedAt: null }, testCase: { id } } as RunRepositoryEntry);
const a = entry("a"), b = entry("b"), c = entry("c", "other");
async function harness() {
  let nav!: ReturnType<typeof useRunExecutionNavigation>; let renderer!: ReactTestRenderer;
  let selected = { id: "outside", run: "run-p", project: "p" };
  let values = [a,b,c], dirty = false, ready = true, scope = "batch", stale = false, writes = 0;
  const committed: string[] = [];
  let write: () => Promise<boolean> = async () => true;
  function Probe() {
    const [id, setId] = useState(selected.id); const [run, setRun] = useState(selected.run);
    const [project, setProject] = useState(selected.project); selected = {id,run,project};
    const model = { data:{workspace:{id:"w"}},selectedRunId:run,selectedRunItemId:id,
      selectedRunItem: {id:stale?"old-detail":id}, setSelectedRunItemId:setId, setSelectedRunId:setRun, setProjectId:setProject,
      setItemStatus:async(_status:unknown, onCommitted:(item:unknown)=>void)=>{writes++;const saved=await write();if(saved)onCommitted?.({id});return saved;},setStepStatus:async()=>{writes++;return write();} } as unknown as WorkspaceModel;
    nav = useRunExecutionNavigation(model, { entries:values,rememberItem:(item:{id:string})=>committed.push(item.id),browser:{ready,loading:false,error:"",batch:{id:scope}} } as unknown as RunRepositoryModel,dirty);
    return null;
  }
  await act(async()=>{renderer=create(<Probe/>);});
  return { get nav(){return nav;}, get selected(){return selected;}, get writes(){return writes;}, committed,
    write(fn:()=>Promise<boolean>){write=fn;},
    async update(opts:{entries?:RunRepositoryEntry[];dirty?:boolean;ready?:boolean;scope?:string;stale?:boolean}) {
      values=opts.entries??values;dirty=opts.dirty??dirty;ready=opts.ready??ready;scope=opts.scope??scope;stale=opts.stale??stale;
      await act(async()=>renderer.update(<Probe/>));
    },async close(){await act(async()=>renderer.unmount());} };
}
test("selection reconciles to the filter and navigation crosses projects only within that sequence",async()=>{
  const h=await harness();try {
    assert.equal(h.selected.id,"a");
    await h.update({entries:[a,c]});
    await act(async()=>h.nav.select("b"));assert.equal(h.selected.id,"a");
    await act(async()=>{await h.nav.mark("passed");});
    assert.deepEqual(h.selected,{id:"c",run:"run-other",project:"other"});assert.deepEqual(h.committed,["a"]);
    await act(async()=>{await h.nav.mark("passed");});assert.equal(h.selected.id,"c");
    await act(async()=>h.nav.select("a"));assert.equal(h.selected.project,"p");
  }finally{await h.close();}
});
test("a disappearing result selects the next remaining match; zero matches never show a hidden case",async()=>{
  const h=await harness();try {
    await h.update({entries:[b,c]});assert.equal(h.selected.id,"b");
    await h.update({entries:[c]});assert.equal(h.selected.id,"c");
    await h.update({entries:[]});assert.equal(h.selected.id,null);assert.equal(h.nav.selectedItem,null);
    await h.update({entries:[a,c]});assert.equal(h.selected.id,"a");
  }finally{await h.close();}
});
test("failed writes do not advance, and dirty drafts or stale detail cannot write a different case",async()=>{
  const h=await harness();try {
    h.write(async()=>false);await act(async()=>{assert.equal(await h.nav.mark("passed"),false);});assert.equal(h.selected.id,"a");
    await h.update({dirty:true});await act(async()=>{h.nav.select("c");assert.equal(await h.nav.mark("passed"),false);});
    assert.equal(h.selected.id,"a");assert.equal(h.writes,1);
    h.write(async()=>true);await act(async()=>{assert.equal(await h.nav.step("s","passed","draft"),true);});
    await h.update({dirty:false,stale:true});assert.equal(h.nav.selectedItem,null);
    await act(async()=>{assert.equal(await h.nav.mark("passed"),false);assert.equal(await h.nav.step("s","passed"),false);});assert.equal(h.writes,2);
  }finally{await h.close();}
});
test("pending mutation blocks double actions and respects a changed filter on completion",async()=>{
  const h=await harness();let finish!:(saved:boolean)=>void;let saving!:Promise<boolean>;
  try {
    h.write(()=>new Promise(resolve=>{finish=resolve;}));
    await act(async()=>{saving=h.nav.mark("passed");});assert.equal(h.nav.pending,true);
    await act(async()=>{h.nav.select("b");assert.equal(await h.nav.mark("passed"),false);});assert.equal(h.writes,1);
    await h.update({entries:[a,c]});
    await act(async()=>{finish(true);await saving;});assert.equal(h.selected.id,"c");assert.equal(h.nav.pending,false);
  }finally{await h.close();}
});
test("changing the run scope while saving cannot advance into the previous run",async()=>{
  const h=await harness();let finish!:(saved:boolean)=>void;let saving!:Promise<boolean>;
  try {
    h.write(()=>new Promise(resolve=>{finish=resolve;}));await act(async()=>{saving=h.nav.mark("passed");});
    const d=entry("d","new");await h.update({scope:"new-batch",entries:[d]});
    await act(async()=>{finish(true);await saving;});assert.equal(h.selected.id,"d");
  }finally{await h.close();}
});
test("loading does not reconcile an old list, archived rows are skipped by auto-advance",async()=>{
  const h=await harness();try {
    await h.update({ready:false,entries:[c]});assert.equal(h.selected.id,"a");assert.equal(h.nav.selectedItem,null);
    await h.update({ready:true,entries:[a,{...b,item:{...b.item,archivedAt:"2026-01-01"}},c]});
    await act(async()=>{await h.nav.mark("passed");});assert.equal(h.selected.id,"c");
  }finally{await h.close();}
});
