import assert from "node:assert/strict";
import test from "node:test";
import { DashboardLayoutController } from "../application/DashboardLayoutController";
import { LayoutError, type LayoutSource, type ProjectBoard, moveWidget, placeWidgets } from "../model/layout";
import { createBoardWidget, widgetCatalog } from "../model/widget-catalog";

const scope = { workspaceId: "w", projectId: "p" };
const widgets = widgetCatalog.slice(0,6).map((entry,index) => createBoardWidget(entry,"en",`w${index}`));
const board: ProjectBoard = { ...scope, id:"board",name:"Quality",widgets:placeWidgets(widgets),etag:'"dashboard:board:1"' };
function setup(overrides: Partial<LayoutSource> = {}) {
  let stored: ProjectBoard | null = null; let saves = 0;
  const source: LayoutSource = { load: async () => stored,
    save: async (s,_,draft) => { saves++; stored = {...s,...draft,id:"board",etag:'"dashboard:board:2"'}; return stored; }, ...overrides };
  const controller = new DashboardLayoutController(source,scope,()=>`command-${++saves}`);
  return {controller, source};
}
test("a new project stays empty until QA explicitly saves; cancel restores the saved layout",async()=>{
  const {controller:c}=setup(); await c.load(); assert.equal(c.getState().board,null);
  c.edit("Project overview"); assert.deepEqual(c.getState().draft?.widgets,[]);
  c.add(widgets); c.move("w4",0); assert.equal(c.getState().draft?.widgets[0].id,"w4");
  c.resize("w4",12); c.remove("w2"); await c.save();
  assert.equal(c.getState().draft,null); assert.equal(c.getState().board?.projectId,"p");
  assert.equal(c.getState().board?.widgets[0].position.width,12);
  c.edit(""); c.remove("w4"); c.cancel(); assert.equal(c.getState().board?.widgets[0].id,"w4");
  await c.load(); assert.equal(c.getState().board?.widgets.length,5);
});
test("a lost save response retries the same command and immutable draft",async()=>{
  const attempts: Array<{key:string;name:string}> = [];
  const {controller:c}=setup({save:async(_,__,draft,key)=>{
    attempts.push({key,name:draft.name}); if(attempts.length===1) throw new LayoutError("unavailable");
    return {...board,...draft};
  }});
  await c.load();c.edit("Original");c.add(widgets);await c.save();
  assert.equal(c.getState().retryPending,true);c.rename("Should not change");c.remove("w0");
  await c.save();assert.deepEqual(attempts[0],attempts[1]);assert.equal(c.getState().board?.name,"Original");
});
test("concurrent changes preserve the draft and require reloading server state",async()=>{
  const {controller:c}=setup({load:async()=>board,save:async()=>{throw new LayoutError("conflict");}});
  await c.load();c.edit("");c.remove("w0");await c.save();
  assert.equal(c.getState().failure,"conflict");assert.equal(c.getState().draft?.widgets.length,5);
  c.rename("Must preserve"); c.remove("w1");
  assert.equal(c.getState().failure,"conflict"); assert.equal(c.getState().draft?.widgets.length,5);
  assert.equal(c.getState().board?.widgets.length,6);await c.load();assert.equal(c.getState().draft,null);
});
test("late reads cannot replace a newer project state or resurrect a disposed screen",async()=>{
  const callbacks: Array<(value:ProjectBoard|null)=>void> = [];
  const {controller:c}=setup({load:()=>new Promise(resolve=>callbacks.push(resolve))});
  const old=c.load();const latest=c.load();callbacks[1](board);await latest;callbacks[0](null);await old;
  assert.equal(c.getState().board?.id,"board");
  const final=c.load();c.dispose();callbacks[2](null);await final;assert.equal(c.getState().board?.id,"board");
});
test("packing preserves order without overlaps after repeated moves and width changes",()=>{
  let layout=placeWidgets(widgets);layout=moveWidget(layout,"w4",0);
  for(let i=0;i<layout.length;i++) for(let j=i+1;j<layout.length;j++) {
    const a=layout[i].position,b=layout[j].position;
    assert.ok(a.y+a.height<=b.y || b.y+b.height<=a.y || a.x+a.width<=b.x || b.x+b.width<=a.x);
  }
  assert.equal(layout[0].id,"w4");assert.deepEqual(moveWidget(layout,"missing",1),layout);
});

test("repeated catalog additions do not duplicate a widget, even with a new client ID",async()=>{
  const {controller:c}=setup(); await c.load(); c.edit("QA"); c.add(widgets);
  c.add(widgets.map(widget=>({...widget,id:`duplicate-${widget.id}`})));
  assert.equal(c.getState().draft?.widgets.length,widgets.length);
  c.remove("w0"); c.add([{...widgets[0],id:"reinstalled"}]);
  assert.equal(c.getState().draft?.widgets[widgets.length - 1]?.id,"reinstalled");
});
