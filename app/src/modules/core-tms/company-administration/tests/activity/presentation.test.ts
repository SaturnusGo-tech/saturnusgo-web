import assert from 'node:assert/strict';
import test from 'node:test';
import { eventPresentation, groupActivityByDay } from '../../presentation/activity-model/event-presentation';
import type { AdministrationEvent } from '../../domain/administration';
const event: AdministrationEvent = { id:'audit_1', action:'test_case.revised', targetName:'HOST-TC-337', actorName:'Anna', occurredAt:'2026-09-15T10:00:00Z',requestId:'req_1',status:null };
test('public case keys remain readable while internal object IDs stay out of the main feed', () => {
  assert.equal(eventPresentation(event,'ru').target,'HOST-TC-337');
  for (const id of ['attachment_b295480414d54f8fa98ce53c010daa5c','step-1789332260736-wslmd','case_6b570228424f4546b16fc7a0e943f23c','e1f95b71-17c8-411d-9c85-e7a3b7cc0f63']) {
    assert.equal(eventPresentation({...event,targetName:id},'ru').target,null);
  }
});
test('authorization is not misrepresented as opening or downloading a file', () => {
  const view=eventPresentation({...event,action:'attachment.read_grant.issued'},'ru');
  assert.equal(view.title,'Разрешён доступ к вложению'); assert.equal(view.technical,true);
  assert.equal(eventPresentation({...event,action:'attachment.upload.finalized'},'ru').technical,false);
});
test('unrecognized events have safe copy in both languages and remain accessible as service events', () => {
  for (const locale of ['ru','en'] as const) {
    const view=eventPresentation({...event,action:'future_feature.internal_operation'},locale);
    assert.equal(view.technical,true); assert.doesNotMatch(view.title,/future_feature|internal_operation/);
  }
});
test('activity is grouped by local calendar day without dropping repeated results', () => {
  const rows=[event,{...event,id:'2'},{...event,id:'3',occurredAt:'2026-09-12T10:00:00Z'}];
  const groups=groupActivityByDay(rows,'ru');
  assert.equal(groups.length,2); assert.deepEqual(groups.flatMap(g=>g.events).map(e=>e.id),['audit_1','2','3']);
});
