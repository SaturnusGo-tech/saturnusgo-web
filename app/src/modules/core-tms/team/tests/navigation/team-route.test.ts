import assert from 'node:assert/strict';
import test from 'node:test';
import { teamUrl } from '../../navigation/team-route';
import { readWorkspaceDeepLink, buildWorkspaceDeepLink } from '../../../state/navigation/workspace-deep-link';
test('team navigation retains workspace context and strips document and member state', () => {
 const href = teamUrl('https://falcon.test/work/?workspaceId=w&projectId=p&view=profile&memberId=other&docId=secret');
 assert.equal(href, '/work/?workspaceId=w&projectId=p&view=team');
 assert.equal(readWorkspaceDeepLink('https://falcon.test'+href).view, 'team');
 assert.equal(new URL(buildWorkspaceDeepLink('https://falcon.test'+href, {workspaceId:'w',projectId:'p',view:'team',runId:null})).searchParams.get('view'), 'team');
});
