// core-investors SOM scale lines to target
export type LineSeries = { id: string; label: string; valuesM: number[]; color?: string; dashed?: boolean };

/**
 * Scales all series so that the sum of their final points (Y{horizon}) equals targetSomM.
 * Keeps inter-series proportions and per-series shapes intact.
 */
export function scaleLinesToTarget(
  lines: LineSeries[],
  baselineSomM: number,
  targetSomM: number
): LineSeries[] {
  const eps = 1e-9;
  const base = Math.max(eps, baselineSomM);
  const k = targetSomM / base;
  if (Math.abs(k - 1) < 1e-9) return lines;

  return lines.map((s) => ({
    ...s,
    valuesM: s.valuesM.map((v) => Math.max(0, Math.round(v * k * 100) / 100)),
  }));
}
