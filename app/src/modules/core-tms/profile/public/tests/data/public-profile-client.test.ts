import assert from 'node:assert/strict';
import test from 'node:test';
import type { TmsHttpClient } from '../../../../../../core/tms/transport/http';
import { createPublicProfileClient } from '../../data/public-profile-client';
test('public profiles use only read-only scoped endpoints, propagate cancellation and never use /me',async()=>{
 const calls:unknown[][]=[],signal=new AbortController().signal;
 const http={getResource:async(...args:unknown[])=>{calls.push(args);return{data:{id:'agent'}};}} as unknown as TmsHttpClient;
 const client=createPublicProfileClient(http,'workspace','agent:codex');
 await client.read(signal);await client.activity('workspace',30,signal);await client.calendar('workspace',2026,signal);await client.achievements('workspace',signal);
 assert.deepEqual(calls.map(v=>v[0]),[
 '/workspaces/workspace/actors/agent%3Acodex/profile','/workspaces/workspace/actors/agent%3Acodex/profile/activity?days=30',
 '/workspaces/workspace/actors/agent%3Acodex/profile/activity?year=2026','/workspaces/workspace/actors/agent%3Acodex/profile/achievements']);
 assert.ok(calls.every(v=>v[1]===signal));
});
