import { Bounds, CalcFn, Horizon, ModelInputs } from '../types/types';

export function solveToTarget(
  base: ModelInputs,
  horizon: Horizon,
  targetUSD: number,
  calc: CalcFn,
  bounds: Bounds,
  toleranceUSD: number
): { inputs: ModelInputs; somUSD: number; limitReason?: string } {
  const VARS: Array<{ key: keyof ModelInputs; min: number; max: number }> = [];

  if (typeof base.somShareOfSAM === 'number') {
    VARS.push({
      key: 'somShareOfSAM',
      min: bounds.minSomShareOfSAM ?? 0,
      max: bounds.maxSomShareOfSAM ?? 1,
    });
  }
  if (typeof base.penetrationPct === 'number') {
    VARS.push({
      key: 'penetrationPct',
      min: bounds.minPenetrationPct ?? 0,
      max: bounds.maxPenetrationPct ?? 100,
    });
  }
  if (typeof base.users === 'number') {
    VARS.push({
      key: 'users',
      min: bounds.minUsers ?? 0,
      max: bounds.maxUsers ?? Math.max(base.users * 5, base.users),
    });
  }

  let bestInputs: ModelInputs = { ...base };
  let { somUSD } = calc(bestInputs, horizon);
  if (Math.abs(somUSD - targetUSD) <= toleranceUSD) {
    return { inputs: bestInputs, somUSD };
  }

  for (const v of VARS) {
    const testAt = (x: number) => {
      const candidate: ModelInputs = { ...bestInputs, [v.key]: x };
      const res = calc(candidate, horizon);
      return { som: res.somUSD, inputs: candidate };
    };

    let L = v.min, R = v.max;
    let best = { som: somUSD, inputs: { ...bestInputs } };
    for (let i = 0; i < 48; i++) {
      const mid = (L + R) / 2;
      const r = testAt(mid);
      if (Math.abs(r.som - targetUSD) < Math.abs(best.som - targetUSD)) best = r;
      if (Math.abs(r.som - targetUSD) <= toleranceUSD) return { inputs: r.inputs, somUSD: r.som };
      if (r.som < targetUSD) L = mid; else R = mid;
    }
    bestInputs = best.inputs;
    somUSD = best.som;
  }

  return { inputs: bestInputs, somUSD, limitReason: 'Target not reachable within provided bounds' };
}
