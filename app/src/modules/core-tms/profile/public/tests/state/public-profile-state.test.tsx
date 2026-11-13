import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { act,create,type ReactTestRenderer } from 'react-test-renderer';
import { usePublicProfile } from '../../application/usePublicProfile';
import type { PublicActorProfile,PublicProfilePort } from '../../domain/public-profile';
const profile:PublicActorProfile={id:'member',name:'Member',kind:'human',provider:null,role:'tester',status:'active',introduction:'QA',bio:'About',avatar:null,banner:null};
const base={activity:async()=>{throw new Error('unused');},calendar:async()=>{throw new Error('unused');},achievements:async()=>({catalogVersion:1 as const,items:[]})};
test('switching profile cancels the old request and ignores its stale response',async()=>{
 let state!:ReturnType<typeof usePublicProfile>,renderer!:ReactTestRenderer,resolve!:(v:PublicActorProfile)=>void,signal!:AbortSignal;
 const first:PublicProfilePort={...base,read:s=>{signal=s;return new Promise(r=>{resolve=r;});}};
 const second:PublicProfilePort={...base,read:async()=>({...profile,id:'other',name:'Other'})};
 function Probe({client}:{client:PublicProfilePort}){state=usePublicProfile(client);return null;}
 await act(async()=>{renderer=create(<Probe client={first}/>);});
 assert.equal(state.loading,true);
 await act(async()=>renderer.update(<Probe client={second}/>));
 assert.equal(signal.aborted,true);assert.equal(state.profile?.name,'Other');
 await act(async()=>resolve(profile));assert.equal(state.profile?.name,'Other');
 await act(async()=>renderer.unmount());
});
test('unavailable profile shows deterministic error and supports a fresh read',async()=>{
 let state!:ReturnType<typeof usePublicProfile>,renderer!:ReactTestRenderer,fail=true;
 const failure=new Error('PROFILE_NOT_FOUND');
 const client:PublicProfilePort={...base,read:async()=>{if(fail)throw failure;return profile;}};
 function Probe(){state=usePublicProfile(client);return null;}
 await act(async()=>{renderer=create(<Probe/>);});
 assert.equal(state.loading,false);assert.equal(state.profile,null);assert.equal(state.error,failure);
 fail=false;await act(async()=>state.retry());assert.equal(state.profile,profile);assert.equal(state.error,null);
 await act(async()=>renderer.unmount());
});
