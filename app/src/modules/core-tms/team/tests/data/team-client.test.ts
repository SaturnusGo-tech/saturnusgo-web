import assert from 'node:assert/strict';
import test from 'node:test';
import type { TmsHttpClient } from '../../../../../core/tms/transport/http';
import { createTeamClient } from '../../data/team-client';

test('team requests preserve tenant/search/cursor scope and present only the card projection', async () => {
  let requested = '', receivedSignal: AbortSignal | undefined;
  const http = {get: async (path: string, signal: AbortSignal) => {
    requested = path; receivedSignal = signal;
    return {data:[{id:'member',name:'QA',kind:'human',role:'tester',status:'active',presence:null,
      avatar:{url:'https://media.test/signed',expiresAt:'2030-01-01'},avatarCharacterId:'nora',
      introduction:'Details belong to the profile',achievements:{earned:2,total:40,remaining:38,
        items:[{slug:'first-scenario',progress:1}],lockedPreview:{slug:'product-map',progress:0}}}],
      meta:{nextCursor:'next',limit:24,hasMore:true}};
  }} as unknown as TmsHttpClient;
  const signal = new AbortController().signal;
  const result = await createTeamClient(http,'tenant/a').list(' QA & API ','cursor+/',signal);
  assert.ok(requested.startsWith('/workspaces/tenant%2Fa/team?'));
  const query = new URL('https://api.test'+requested).searchParams;
  assert.equal(query.get('limit'),'24'); assert.equal(query.get('search'),'QA & API');
  assert.equal(query.get('cursor'),'cursor+/'); assert.equal(receivedSignal,signal);
  assert.equal(result.items[0].avatarUrl,'https://media.test/signed');
  assert.equal(result.items[0].achievements.remaining,38);
  assert.deepEqual(result.items[0].achievements.items,[{slug:'first-scenario'}]);
  assert.equal('introduction' in result.items[0],false);
  assert.equal(result.nextCursor,'next');
});
