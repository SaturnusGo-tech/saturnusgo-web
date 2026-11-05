type Point = { x: number; y: number };

/** A closed, gently irregular orbit, resampled by distance for an even pace. */
export function achievementOrbit(start: Point, center: Point): Keyframe[] {
  const dx = start.x - center.x;
  const dy = start.y - center.y;
  const phase = Math.atan2(dy, dx);
  const power = 6;
  const radius = .35;
  const size = (Math.abs(dx / radius) ** power + Math.abs(dy / radius) ** power) ** (1 / power);
  const ripple = (angle: number) => .006 * Math.sin(3 * angle + phase) + .004 * Math.sin(5 * angle - phase);
  const points: Point[] = [];
  const distances = [0];

  for (let i = 0; i <= 720; i++) {
    const angle = phase + i / 720 * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const distance = radius * size / (Math.abs(cos) ** power + Math.abs(sin) ** power) ** (1 / power);
    const drift = ripple(angle) - ripple(phase);
    const point = { x: center.x + cos * (distance + drift), y: center.y + sin * (distance + drift) };
    if (i > 0) distances.push(distances[i - 1] + Math.hypot(point.x - points[i - 1].x, point.y - points[i - 1].y));
    points.push(point);
  }

  const frames: Keyframe[] = [];
  let segment = 1;
  for (let i = 0; i <= 180; i++) {
    const target = distances[720] * i / 180;
    while (segment < 720 && distances[segment] < target) segment++;
    const fraction = (target - distances[segment - 1]) / (distances[segment] - distances[segment - 1]);
    const before = points[segment - 1];
    const after = points[segment];
    const x = (before.x + (after.x - before.x) * fraction - start.x) * 100;
    const y = (before.y + (after.y - before.y) * fraction - start.y) * 100;
    // Pin both ends exactly to the original composition: no jump on the next lap.
    frames.push({ transform: i === 0 || i === 180 ? 'translate3d(0%, 0%, 0)' : `translate3d(${x.toFixed(5)}%, ${y.toFixed(5)}%, 0)` });
  }
  return frames;
}
