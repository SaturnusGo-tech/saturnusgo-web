import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { TeamMember } from '../../domain/team';
import { installSecurityControls } from '../../../company-administration/tests/support/security-controls';

(globalThis as typeof globalThis & {React: typeof React}).React = React;
const restore = installSecurityControls();
const {TeamAvatar} = require('../../presentation/avatar/TeamAvatar') as typeof import('../../presentation/avatar/TeamAvatar');
restore();

test('both unavailable avatar sources fall back to initials without retrying failed images', async () => {
  let view!: ReactTestRenderer;
  const member = {id:'person',name:'QA',kind:'human',avatarUrl:'https://example.test/photo.webp',avatarCharacterId:'nora'} as TeamMember;
  await act(async () => {view = create(<TeamAvatar member={member}/>);});
  assert.equal(view.root.findByType('img').props.src, member.avatarUrl);
  await act(async () => view.root.findByType('img').props.onError());
  assert.match(view.root.findByType('img').props.src, /nora.webp$/);
  await act(async () => view.root.findByType('img').props.onError());
  assert.equal(view.root.findAllByType('img').length, 0);
  assert.match(JSON.stringify(view.toJSON()), /QA/);
  await act(async () => view.unmount());
});
