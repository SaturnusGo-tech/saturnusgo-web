import assert from 'node:assert/strict';
import test from 'node:test';
import { WORKFLOW_DURATION, WORKFLOW_SEND_AT, WORKFLOW_STAGE_AT, workflowFrame, workflowStory } from '../workflow-story';

test('the prompt finishes before it is sent and the artifacts reveal in work order', () => {
  for (const { prompt } of Object.values(workflowStory)) {
    assert.equal(workflowFrame(0, prompt).prompt, '');
    const beforeSend = workflowFrame(WORKFLOW_SEND_AT - 1, prompt);
    assert.equal(beforeSend.prompt, prompt);
    assert.equal(beforeSend.sent, false);
    assert.equal(beforeSend.stage, -1);
    assert.equal(workflowFrame(WORKFLOW_SEND_AT, prompt).sent, true);
    WORKFLOW_STAGE_AT.forEach((start, index) => {
      assert.equal(workflowFrame(start - 1, prompt).stage, index - 1);
      assert.equal(workflowFrame(start, prompt).stage, index);
    });
  }
});

test('reduced motion and a completed clock resolve to a readable final artifact', () => {
  for (const { prompt, stages, stageDetail, files } of Object.values(workflowStory)) {
    const frame = workflowFrame(WORKFLOW_DURATION, prompt);
    assert.equal(frame.stage, stages.length - 1);
    assert.equal(frame.prompt, prompt);
    assert.equal(frame.complete, true);
    assert.equal(stageDetail.length, stages.length);
    assert.equal(files.length, stages.length);
  }
});

test('typing uses Unicode characters and clamps a clock outside its range', () => {
  assert.equal(workflowFrame(-100, 'a🦅b').prompt, '');
  assert.equal(workflowFrame(1_700, 'a🦅b').prompt, 'a🦅');
  assert.deepEqual(workflowFrame(Number.MAX_SAFE_INTEGER, 'a🦅b'), {
    prompt: 'a🦅b', sent: true, stage: 4, complete: true,
  });
});
