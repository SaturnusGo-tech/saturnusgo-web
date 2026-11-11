import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const clockURL = new URL('../useWorkflowClock.ts', import.meta.url).href;
const modelURL = new URL('../workflow-story.ts', import.meta.url).href;

function renderWithPreference(browser: boolean) {
  const result = spawnSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', `
    if (${browser}) {
      globalThis.window = { matchMedia: () => ({ matches: true, addEventListener() {} }) };
      globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} };
    }
    const React = (await import('react')).default;
    const { renderToString } = await import('react-dom/server');
    const clock = await import(${JSON.stringify(clockURL)});
    const { useWorkflowClock } = clock.default ?? clock;
    const model = await import(${JSON.stringify(modelURL)});
    const { workflowFrame, workflowStory, WORKFLOW_DURATION } = model.default ?? model;
    let state;
    function Probe() {
      state = useWorkflowClock();
      return React.createElement('output', { 'data-reduced': state.reducedMotion }, workflowFrame(state.elapsed, workflowStory.ru.prompt).prompt);
    }
    const html = renderToString(React.createElement(Probe));
    let mounted = null;
    if (${browser}) {
      const { act, create } = await import('react-test-renderer');
      let renderer;
      await act(async () => { renderer = create(React.createElement(Probe)); });
      mounted = { reducedMotion: state.reducedMotion, elapsed: state.elapsed, duration: WORKFLOW_DURATION };
      await act(async () => renderer.unmount());
    }
    process.stdout.write(JSON.stringify({ html, mounted }));
  `], { encoding: 'utf8', cwd: process.cwd() });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout) as { html: string; mounted: { reducedMotion: boolean; elapsed: number; duration: number } | null };
}

test('a reduced-motion browser hydrates the server frame before showing the final workflow', () => {
  const server = renderWithPreference(false);
  const browser = renderWithPreference(true);
  assert.equal(browser.html, server.html, 'the first client render must match the server prompt and motion attributes');
  assert.ok(browser.mounted);
  assert.equal(browser.mounted.reducedMotion, true);
  assert.equal(browser.mounted.elapsed, browser.mounted.duration, 'after mounting, reduced motion shows the complete readable artifact');
});
