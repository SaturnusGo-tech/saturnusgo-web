export const clamp01 = (value) => Math.max(0, Math.min(1, value));

export function smoothstep(value) {
  const progress = clamp01(value);
  return progress * progress * (3 - 2 * progress);
}

export function strokeReveal(time, delay = 0, duration = 1) {
  if (time < delay) return 0;
  if (!(duration > 0) || !Number.isFinite(duration)) return 1;
  return smoothstep((time - delay) / duration);
}

/**
 * Build a bounded, continuously differentiable camera track.
 * Keys are [time, x, y, scale, rotation] with strictly increasing times.
 */
export function createCameraTrack(keys) {
  const frames = keys.map((key) => key.slice());
  const last = frames.length - 1;
  const durations = frames.slice(1).map((frame, index) => frame[0] - frames[index][0]);
  const secants = durations.map((duration, index) =>
    frames[index].slice(1).map((value, channel) => (frames[index + 1][channel + 1] - value) / duration),
  );
  const tangents = frames.map(() => [0, 0, 0, 0]);

  // The PCHIP weighted harmonic mean preserves monotonicity on unequal intervals.
  // Shared knot tangents keep velocity continuous; holds and reversals stop it.
  for (let index = 1; index < last; index++) {
    const previousDuration = durations[index - 1];
    const nextDuration = durations[index];
    const previousWeight = 2 * nextDuration + previousDuration;
    const nextWeight = nextDuration + 2 * previousDuration;
    for (let channel = 0; channel < 4; channel++) {
      const previousSlope = secants[index - 1][channel];
      const nextSlope = secants[index][channel];
      if (previousSlope === 0 || nextSlope === 0 || Math.sign(previousSlope) !== Math.sign(nextSlope)) continue;
      tangents[index][channel] = (previousWeight + nextWeight)
        / (previousWeight / previousSlope + nextWeight / nextSlope);
    }
  }

  return (time) => {
    if (last === 0 || time <= frames[0][0]) return frames[0].slice(1);
    if (time >= frames[last][0]) return frames[last].slice(1);

    let index = 1;
    while (time > frames[index][0]) index++;
    const before = frames[index - 1];
    const after = frames[index];
    const duration = durations[index - 1];
    const progress = (time - before[0]) / duration;
    const squared = progress * progress;
    const cubed = squared * progress;
    const h00 = 2 * cubed - 3 * squared + 1;
    const h10 = cubed - 2 * squared + progress;
    const h01 = -2 * cubed + 3 * squared;
    const h11 = cubed - squared;

    return before.slice(1).map((value, channel) => {
      const destination = after[channel + 1];
      const interpolated = h00 * value + h10 * duration * tangents[index - 1][channel]
        + h01 * destination + h11 * duration * tangents[index][channel];
      // Guard against roundoff at the bounds without introducing overshoot.
      return Math.max(Math.min(value, destination), Math.min(Math.max(value, destination), interpolated));
    });
  };
}
