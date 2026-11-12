import test from 'node:test';
import assert from 'node:assert/strict';
import * as motion from './motion.mjs';

const cameraTrack = motion.createCameraTrack;

function close(actual, expected, tolerance = 1e-7) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be within ${tolerance} of ${expected}`);
}

test('camera interpolates nonuniform key times and holds the boundary poses', () => {
  const track = cameraTrack([
    [0, 1, 2, 1, 0],
    [0.4, -5, 5, 1.4, -2],
    [3, 8, 1, 1.1, 6],
    [8, 10, 5, 1.2, 4],
  ]);
  assert.deepEqual(track(-10), [1, 2, 1, 0]);
  assert.deepEqual(track(0), [1, 2, 1, 0]);
  assert.deepEqual(track(0.4), [-5, 5, 1.4, -2]);
  assert.deepEqual(track(3), [8, 1, 1.1, 6]);
  assert.deepEqual(track(8), [10, 5, 1.2, 4]);
  assert.deepEqual(track(100), [10, 5, 1.2, 4]);
});

test('camera stays within adjacent poses even across abrupt scale and timing changes', () => {
  const keys = [
    [0, 0, 5, 1, -3],
    [0.03, 80, -2, 1.8, 5],
    [7, 81, -10, 1.81, 4],
    [7.001, -20, 20, 0.8, 4],
    [50, 10, 0, 1.2, -2],
  ];
  const track = cameraTrack(keys);
  for (let index = 1; index < keys.length; index++) {
    const before = keys[index - 1];
    const after = keys[index];
    for (let sample = 0; sample <= 200; sample++) {
      const pose = track(before[0] + (after[0] - before[0]) * sample / 200);
      pose.forEach((value, channel) => {
        assert.ok(Number.isFinite(value));
        assert.ok(value >= Math.min(before[channel + 1], after[channel + 1]) - 1e-10);
        assert.ok(value <= Math.max(before[channel + 1], after[channel + 1]) + 1e-10);
      });
    }
  }
});

test('same-direction camera knots share nonzero time-weighted harmonic velocity', () => {
  const track = cameraTrack([
    [0, 0, 0, 1, 0],
    [1, 2, 4, 1.2, -2],
    [4, 5, 10, 1.5, -5],
    [6, 9, 18, 1.9, -9],
  ]);
  const epsilon = 1e-5;
  for (const [time, expected] of [[1, 24 / 17], [4, 15 / 11]]) {
    const at = track(time);
    const before = track(time - epsilon);
    const after = track(time + epsilon);
    for (const [channel, factor] of [[0, 1], [1, 2], [2, 0.1], [3, -1]]) {
      const incoming = (at[channel] - before[channel]) / epsilon;
      const outgoing = (after[channel] - at[channel]) / epsilon;
      close(incoming, expected * factor, 1e-4);
      close(outgoing, expected * factor, 1e-4);
      close(incoming, outgoing, 1e-4);
    }
  }
});

test('camera preserves holds and stops at extrema', () => {
  const track = cameraTrack([
    [0, 0, 0, 1, 0],
    [1, 10, 10, 2, 2],
    [2, 10, 5, 2, 4],
    [3, 10, 10, 2, 2],
    [4, 20, 0, 3, 0],
  ]);
  for (const time of [1, 1.25, 1.75, 2, 2.5, 2.9, 3]) {
    close(track(time)[0], 10);
    close(track(time)[2], 2);
  }
  const epsilon = 1e-6;
  for (const [time, channel] of [[1, 0], [3, 0], [1, 1], [2, 1], [3, 1], [2, 3]]) {
    close((track(time)[channel] - track(time - epsilon)[channel]) / epsilon, 0, 1e-4);
    close((track(time + epsilon)[channel] - track(time)[channel]) / epsilon, 0, 1e-4);
  }
});

test('camera begins and ends at rest', () => {
  const track = cameraTrack([[0, 0, 0, 1, 0], [3, 12, -6, 2, 3]]);
  const epsilon = 1e-6;
  for (let channel = 0; channel < 4; channel++) {
    close((track(epsilon)[channel] - track(0)[channel]) / epsilon, 0, 1e-4);
    close((track(3)[channel] - track(3 - epsilon)[channel]) / epsilon, 0, 1e-4);
  }
});

test('a single camera pose remains constant', () => {
  const track = cameraTrack([[2, 10, 20, 1.5, -2]]);
  for (const time of [-10, 2, 100]) assert.deepEqual(track(time), [10, 20, 1.5, -2]);
});

test('clamp and cubic smoothstep produce bounded easing with stationary endpoints', () => {
  assert.equal(typeof motion.clamp01, 'function');
  assert.equal(typeof motion.smoothstep, 'function');
  for (const [input, expected] of [[-1, 0], [0, 0], [0.25, 0.25], [1, 1], [2, 1]]) {
    assert.equal(motion.clamp01(input), expected);
  }
  for (const [input, expected] of [[-1, 0], [0, 0], [0.25, 0.15625], [0.5, 0.5], [1, 1], [2, 1]]) {
    assert.equal(motion.smoothstep(input), expected);
  }
  close(motion.smoothstep(1e-6) / 1e-6, 0, 1e-4);
  close((1 - motion.smoothstep(1 - 1e-6)) / 1e-6, 0, 1e-4);
});

test('stroke reveal finishes smoothly and never restarts after completion', () => {
  assert.equal(typeof motion.strokeReveal, 'function');
  assert.equal(motion.strokeReveal(1, 2, 3), 0);
  assert.equal(motion.strokeReveal(2, 2, 3), 0);
  assert.equal(motion.strokeReveal(3.5, 2, 3), 0.5);
  let previous = 0;
  for (let time = 2; time <= 8; time += 0.01) {
    const value = motion.strokeReveal(time, 2, 3);
    assert.ok(value >= previous);
    assert.ok(value <= 1);
    previous = value;
  }
  for (const time of [5, 5.5, 6, 8, 20, 100]) assert.equal(motion.strokeReveal(time, 2, 3), 1);
  close((1 - motion.strokeReveal(5 - 1e-6, 2, 3)) / 1e-6, 0, 1e-4);
});

test('stroke reveal handles unusable durations without NaN or a restart', () => {
  assert.equal(typeof motion.strokeReveal, 'function');
  for (const duration of [0, -1, NaN, Infinity]) {
    assert.equal(motion.strokeReveal(1.9, 2, duration), 0);
    assert.equal(motion.strokeReveal(2, 2, duration), 1);
    assert.equal(motion.strokeReveal(20, 2, duration), 1);
  }
});
