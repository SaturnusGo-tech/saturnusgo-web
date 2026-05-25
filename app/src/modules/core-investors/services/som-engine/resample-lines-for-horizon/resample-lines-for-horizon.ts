// core-investors SOM resample lines for horizon
export type LineSeries = {
    id: string;
    label: string;
    valuesM: number[]; // values in $M
    color?: string;
    dashed?: boolean;
  };
  
  /**
   * Resamples each series to Y0..Y{horizon} from a baseline shape.
   * - Preserves each series' growth shape using piecewise-linear allocation.
   * - No business logic: purely visual re-sampling.
   */
  export function resampleLinesForHorizon(
    lines: LineSeries[],
    horizon: 3 | 5 | 10
  ): LineSeries[] {
    const segments = horizon;
    const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
  
    const resample = (vals: number[]): number[] => {
      const n = vals.length;
      if (n < 2) {
        const v = vals[0] ?? 0;
        return Array.from({ length: segments + 1 }, () => v);
      }
  
      const deltas = Array.from({ length: n - 1 }, (_, i) => Math.max(0, vals[i + 1] - vals[i]));
      const totalDelta = deltas.reduce((a, b) => a + b, 0);
  
      // Flat shape → linear interpolation
      if (totalDelta <= 1e-9) {
        const out: number[] = [];
        const start = vals[0];
        const end = vals[n - 1];
        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          out.push(start + (end - start) * t);
        }
        return out;
      }
  
      // Largest Remainder method to allocate integer steps across baseline segments
      const rawAlloc = deltas.map((d) => (d / totalDelta) * segments);
      const baseAlloc = rawAlloc.map((x) => Math.floor(x));
      let assigned = baseAlloc.reduce((a, b) => a + b, 0);
      const need = segments - assigned;
  
      const remainders = rawAlloc
        .map((x, i) => ({ i, frac: x - Math.floor(x) }))
        .sort((a, b) => b.frac - a.frac);
  
      for (let k = 0; k < Math.abs(need); k++) {
        const idx = remainders[k % remainders.length].i;
        baseAlloc[idx] += need > 0 ? 1 : -1;
      }
  
      // Normalize to exactly "segments" and clamp
      let diff = segments - baseAlloc.reduce((a, b) => a + b, 0);
      for (let i = 0; diff !== 0 && i < baseAlloc.length; i++) {
        const can = diff > 0 ? Infinity : baseAlloc[i];
        const step = diff > 0 ? 1 : -1;
        if (can > 0) {
          baseAlloc[i] += step;
          diff -= step;
          i = -1;
        }
      }
      for (let i = 0; i < baseAlloc.length; i++) baseAlloc[i] = clamp(baseAlloc[i], 0, segments);
  
      const out: number[] = [vals[0]];
      for (let seg = 0; seg < n - 1; seg++) {
        const steps = baseAlloc[seg];
        const a = vals[seg];
        const b = vals[seg + 1];
        if (steps <= 0) continue;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          out.push(a + (b - a) * t);
        }
      }
      out.length = segments + 1;
      out[segments] = vals[n - 1];
      return out;
    };
  
    return lines.map((s) => ({ ...s, valuesM: resample(s.valuesM) }));
  }
  