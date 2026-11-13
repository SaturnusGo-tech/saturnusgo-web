import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { act,create,type ReactTestRenderer } from 'react-test-renderer';
import { useTeam } from '../../application/useTeam';
import type { TeamPage,TeamPort } from '../../domain/team';
const page = (id:string,cursor:string|null=null):TeamPage => ({items:[{id} as never],nextCursor:cursor});
test('stale searches are cancelled and cannot replace the active team result', async () => {
 const requests:{query:string;signal:AbortSignal;resolve:(page:TeamPage)=>void}[]=[];
 const port:TeamPort={list:(query,_cursor,signal)=>new Promise(resolve=>requests.push({query,signal,resolve}))};
 let state!:ReturnType<typeof useTeam>,renderer!:ReactTestRenderer;
 function Probe({query}:{query:string}) {state=useTeam(port,query);return null;}
 await act(async()=>{renderer=create(<Probe query=""/>);});
 await act(async()=>renderer.update(<Probe query="Nora"/>));
 assert.equal(requests[0].signal.aborted,true);
 await act(async()=>requests[1].resolve(page('nora')));
 await act(async()=>requests[0].resolve(page('stale')));
 assert.equal(state.items[0].id,'nora');
 await act(async()=>renderer.unmount());
});
test('pagination retains the active search and a workspace switch clears the previous team',async()=>{
 const queries:{query:string;cursor:string|null}[]=[];
 const port:TeamPort={list:async(query,cursor)=>{queries.push({query,cursor});return cursor?page('two'):page('one','next');}};
 const other:TeamPort={list:async()=>page('new-workspace')};
 let state!:ReturnType<typeof useTeam>,renderer!:ReactTestRenderer;
 function Probe({client}:{client:TeamPort}) {state=useTeam(client,'QA');return null;}
 await act(async()=>{renderer=create(<Probe client={port}/>);});
 await act(async()=>{await state.loadMore();});
 assert.deepEqual(queries,[{query:'QA',cursor:null},{query:'QA',cursor:'next'}]);
 assert.deepEqual(state.items.map(item=>item.id),['one','two']);
 await act(async()=>renderer.update(<Probe client={other}/>));
 assert.deepEqual(state.items.map(item=>item.id),['new-workspace']);
 await act(async()=>renderer.unmount());
});
