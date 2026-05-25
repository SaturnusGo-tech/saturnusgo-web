export type Horizon = 3 | 5 | 10;

export type RoundingPolicy = {
  money: 'ceil' | 'floor' | 'round';
  precision: number;
};

export type ModelInputs = {
  tamUSD: number;
  samUSD: number;
  somShareOfSAM?: number;
  users?: number;
  penetrationPct?: number;
  arpuUSD?: number;
  takeRate?: number;
  [k: string]: unknown;
};

export type CalcPayload = {
  somUSD: number;
  metrics: Record<string, unknown>;
};

export type CalcFn = (inputs: ModelInputs, horizon: Horizon) => CalcPayload;

export type Bounds = {
  minPenetrationPct?: number;
  maxPenetrationPct?: number;
  minSomShareOfSAM?: number;
  maxSomShareOfSAM?: number;
  minUsers?: number;
  maxUsers?: number;
};

export type TargetsUSD = { 5: number; 10: number };

export type SomEngineConfig = {
  baselineInputs: ModelInputs;
  calc: CalcFn;
  targetsUSD: TargetsUSD;
  rounding?: RoundingPolicy;
  bounds?: Bounds;
  tolerancePctOfTarget?: number;
};

export type SomStatus = {
  isCalculating: boolean;
  isValid: boolean;
  warnings: string[];
  errors: string[];
};

export type SomResult = {
  horizon: Horizon;
  somUSD: number;
  metrics: Record<string, unknown>;
  targetHit?: boolean;
  deltaToTargetUSD?: number;
  limitReason?: string;
};
