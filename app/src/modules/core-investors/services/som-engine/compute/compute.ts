import { approxEq, roundMoney } from "../math/math";
import { Horizon, SomEngineConfig, SomResult } from "../types/types";
import { validateConfig } from "../validators/validators";
import { solveToTarget } from "../solver/solver";


export function computeSom(cfg: SomEngineConfig, horizon: Horizon): SomResult {
  const errors = validateConfig(cfg);
  if (errors.length) {
    return {
      horizon,
      somUSD: NaN,
      metrics: {},
      targetHit: false,
      deltaToTargetUSD: NaN,
      limitReason: errors.join('; '),
    };
  }

  const tolPct = cfg.tolerancePctOfTarget ?? 0.005;

  if (horizon === 3) {
    const { somUSD, metrics } = cfg.calc(cfg.baselineInputs, 3);
    return { horizon: 3, somUSD: roundMoney(somUSD, cfg.rounding), metrics };
  }

  const targetUSD = horizon === 5 ? cfg.targetsUSD[5] : cfg.targetsUSD[10];
  const toleranceUSD = Math.max(1, targetUSD * tolPct);

  const adjusted = solveToTarget(cfg.baselineInputs, horizon, targetUSD, cfg.calc, cfg.bounds ?? {}, toleranceUSD);
  const somRounded = roundMoney(adjusted.somUSD, cfg.rounding);
  const { metrics } = cfg.calc(adjusted.inputs, horizon);

  const hit = approxEq(somRounded, targetUSD, toleranceUSD);
  return { horizon, somUSD: somRounded, metrics, targetHit: hit, deltaToTargetUSD: targetUSD - somRounded, limitReason: adjusted.limitReason };
}
