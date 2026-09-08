import assert from "node:assert/strict";
import test from "node:test";
import { DashboardLayoutController } from "../application/DashboardLayoutController";
import { LayoutError, type LayoutSource, type ProjectBoard, moveWidget, placeWidgets } from "../model/layout";
import { createBoardWidget, widgetCatalog, widgetLayoutWidth, widgetKey, widgetByKey } from "../model/widget-catalog";

import { consolidateWidgets, freshnessLegacyKeys } from "../migration/consolidate-widgets";
import { sectionMoveTarget, widgetSection } from "../sections/widget-sections";

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

test("legacy full-width metrics render compactly and are normalized only in the editing draft",async()=>{
  const metric = createBoardWidget(widgetByKey.get("currentCases")!,"en","compact-metric");
  const visual = createBoardWidget(widgetByKey.get("coverage")!,"en","visual");
  const oldMetric = {...metric,position:{...metric.position,width:12}};
  const legacy = {...board,widgets:[oldMetric,visual]};
  const {controller:c}=setup({load:async()=>legacy}); await c.load();
  assert.equal(widgetLayoutWidth(oldMetric),3);
  assert.equal(c.getState().board?.widgets[0].position.width,12);
  c.edit(""); assert.equal(c.getState().draft?.widgets[0].position.width,3);
  c.resize(oldMetric.id,12); assert.equal(c.getState().draft?.widgets[0].position.width,3);
  c.resize(visual.id,12); assert.equal(c.getState().draft?.widgets[1].position.width,12);
  c.cancel(); assert.equal(c.getState().board?.widgets[0].position.width,12);
  c.edit(""); await c.save(); assert.equal(c.getState().board?.widgets[0].position.width,3);
});

const definition = (key:string) => createBoardWidget(widgetByKey.get(key)!,"en",key);
const legacyWidgets = () => [...freshnessLegacyKeys].map((key,index) => ({...definition("currentCases"),
  id:`legacy-${index}`,title:`Saved ${key}`,settings:{presentation:key,custom:{owner:"qa"}}}));

test("36 legacy widgets consolidate to 29 while keeping saved freshness identity and custom settings",()=>{
  const existing = {...definition("freshness"),id:"saved-freshness",title:"My freshness",settings:{presentation:"freshness",custom:{page:1}}};
  const all = widgetCatalog.map(item=>item.key==="freshness"?existing:definition(item.key));
  const input = [...legacyWidgets().slice(0,3),...all,...legacyWidgets().slice(3)];
  const before = structuredClone(input);
  assert.equal(input.length,36);
  const merged = consolidateWidgets(input);
  assert.equal(merged.length,29);assert.equal(new Set(merged.map(widgetKey)).size,29);
  const freshness = merged.find(item=>widgetKey(item)==="freshness")!;
  assert.equal(freshness.id,"saved-freshness");assert.equal(freshness.title,"My freshness");
  assert.deepEqual(freshness.settings,existing.settings);assert.equal(freshness.type,existing.type);
  assert.deepEqual(merged.filter(item=>item.id!==freshness.id).map(item=>[item.id,item.type,item.title,item.settings]),
    all.filter(item=>item.id!==existing.id).map(item=>[item.id,item.type,item.title,item.settings]));
  assert.deepEqual(input,before);assert.strictEqual(consolidateWidgets(merged),merged);
});

test("without freshness, only the first legacy signal is upgraded and unknown widgets are retained",()=>{
  const old = legacyWidgets();
  const unknown = {...definition("currentCases"),id:"future-widget",title:"Future widget",settings:{presentation:"future:plugin",retained:true}};
  const input = [definition("queue"),old[0],unknown,definition("types"),...old.slice(1)];
  const merged = consolidateWidgets(input);
  assert.deepEqual(merged.map(widgetKey),["queue","freshness","future:plugin","types"]);
  assert.equal(merged[1].id,old[0].id);assert.equal(merged[1].type,"recent_activity");
  assert.equal(merged[1].position.width,3);assert.equal(merged[1].position.height,3);
  assert.deepEqual(merged[1].settings,{...old[0].settings,presentation:"freshness"});
  assert.equal(merged.filter(item=>widgetKey(item)==="freshness").length,1);
  assert.deepEqual(merged[2].settings,unknown.settings);assert.equal(merged[2].title,unknown.title);
  assert.strictEqual(consolidateWidgets(merged),merged);
});

test("loading presents a consolidated board without saving or mutating server state; cancel preserves it",async()=>{
  const persisted = {...board,widgets:[...legacyWidgets(),definition("queue"),definition("freshness")]};
  const original = structuredClone(persisted);let saves=0;let commands=0;
  const source:LayoutSource={load:async()=>persisted,save:async()=>{saves++;return persisted;}};
  const c=new DashboardLayoutController(source,scope,()=>`command-${++commands}`);
  await c.load();const normalized=c.getState().board!;
  assert.deepEqual(normalized.widgets.map(widgetKey),["queue","freshness"]);
  assert.equal(normalized.id,persisted.id);assert.equal(normalized.etag,persisted.etag);
  assert.equal(normalized.name,persisted.name);assert.equal(c.getState().draft,null);
  c.edit("Ignored");c.remove("freshness");c.rename("Unsaved");c.cancel();
  assert.strictEqual(c.getState().board,normalized);assert.equal(c.getState().draft,null);
  assert.equal(saves,0);assert.equal(commands,0);assert.deepEqual(persisted,original);
});

test("section drag targets reorder only the intended section while retaining unrelated and unknown widgets",()=>{
  const unknown={...definition("currentCases"),id:"unknown",settings:{presentation:"future:widget"}};
  const input=[definition("queue"),definition("trend"),definition("defects"),definition("outcomes"),unknown,definition("portfolio")];
  const others=(items:typeof input)=>items.filter(item=>widgetSection(widgetKey(item))!=="runs").map(item=>item.id);
  const target=sectionMoveTarget(input,"runs",0);assert.equal(target,1);
  const moved=moveWidget(input,"portfolio",target);
  assert.deepEqual(moved.filter(item=>widgetSection(widgetKey(item))==="runs").map(item=>item.id),["portfolio","trend","outcomes"]);
  assert.deepEqual(others(moved),others(input));assert.ok(moved.some(item=>item.id==="unknown"));
  const reverse=moveWidget(moved,"portfolio",sectionMoveTarget(moved,"runs",2));
  assert.deepEqual(reverse.filter(item=>widgetSection(widgetKey(item))==="runs").map(item=>item.id),["trend","outcomes","portfolio"]);
  assert.deepEqual(others(reverse),others(input));
  assert.equal(sectionMoveTarget(input,"runs",-1),-1);assert.equal(sectionMoveTarget(input,"runs",3),-1);
  assert.deepEqual(moveWidget(input,"trend",sectionMoveTarget(input,"runs",99)),input);
});
