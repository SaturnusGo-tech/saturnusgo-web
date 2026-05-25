import { SomEngineConfig } from '../types/types';

export function validateConfig(cfg: SomEngineConfig): string[] {
  const warns: string[] = [];
  if (!cfg) return ['Config is undefined'];
  if (!cfg.calc) warns.push('calc function is missing');
  if (!cfg.baselineInputs) warns.push('baselineInputs are missing');
  if (!cfg.targetsUSD) warns.push('targetsUSD are missing');
  else {
    if (typeof cfg.targetsUSD[5] !== 'number') warns.push('targetsUSD[5] is not a number');
    if (typeof cfg.targetsUSD[10] !== 'number') warns.push('targetsUSD[10] is not a number');
  }
  return warns;
}
