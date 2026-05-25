'use client';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { Horizon, SomEngineConfig, SomResult, SomStatus } from '../../som-engine/types/types';
import { computeSom } from '../../som-engine/compute/compute';

export function useSomController(config: SomEngineConfig, initialHorizon: Horizon = 3) {
  const [horizon, setH] = useState<Horizon>(initialHorizon);
  const statusRef = useRef<SomStatus>({ isCalculating: false, isValid: true, warnings: [], errors: [] });

  const memoKey = useMemo(() => JSON.stringify(config), [config]);

  const result: SomResult = useMemo(() => {
    statusRef.current.isCalculating = true;
    const r = computeSom(config, horizon);
    statusRef.current.isCalculating = false;
    statusRef.current.isValid = Number.isFinite(r.somUSD);
    statusRef.current.errors = r.limitReason && !r.targetHit ? [r.limitReason] : [];
    statusRef.current.warnings = !r.targetHit && r.limitReason ? ['Target not precisely hit'] : [];
    return r;
  }, [memoKey, horizon]);

  const setHorizon = useCallback((h: Horizon) => setH(h), []);

  return {
    horizon,
    setHorizon,
    som: result.somUSD,
    metrics: result.metrics,
    status: statusRef.current,
    debug: { targetHit: result.targetHit, deltaToTargetUSD: result.deltaToTargetUSD, limitReason: result.limitReason },
  };
}
