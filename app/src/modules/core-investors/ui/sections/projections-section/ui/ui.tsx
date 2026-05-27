// File: sections/ProjectionsWithController.tsx
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

import Section from '../../../items/section';
import MarketChartStreams from '../../../items/market-chart-streams';
import MarketChart from '../../../items/market-chart';

import type { SomEngineConfig } from '../../../../services/som-engine';
import { useSomController } from '../../../../services/som-controller';
import { ControllerSegment } from '../../../../services/som-engine';
import { scaleLinesToTarget } from '../../../../services/som-engine';
import { resampleLinesForHorizon } from '../../../../services/som-engine';

export default function ProjectionsWithController() {
  // Non-ride baseline lines (kept as-is for Y3)
  const baseLines = [
    { id: 'subs',     label: 'Subscriptions',         valuesM: [6, 16, 25, 32], color: '#245cff' },
    { id: 'bookings', label: 'Bookings (12%)',        valuesM: [0.4, 1.5, 2.5, 2.8], color: '#1b8cff' },
    { id: 'events',   label: 'Events (15%)',          valuesM: [0.5, 1.3, 2.0, 2.8], color: '#27b7ff' },
    { id: 'b2b2c',    label: 'B2B2C (fixed+uplift)',  valuesM: [1, 3, 4.5, 6], color: '#6b7cff' },
  ];
  const baseSomY3_M   = 32 + 2.8 + 2.8 + 6;   // 43.6 ($M)
  const baseSomY3_USD = baseSomY3_M * 1e6;    // $43.6M

  // Calc adapter
  const calc: SomEngineConfig['calc'] = (inputs, horizon) => {
    let somUSD: number;
    if (typeof inputs.somShareOfSAM === 'number') {
      somUSD = inputs.samUSD * inputs.somShareOfSAM;
    } else if (
      typeof inputs.users === 'number' &&
      typeof inputs.arpuUSD === 'number' &&
      typeof inputs.takeRate === 'number'
    ) {
      somUSD = inputs.users * inputs.arpuUSD * inputs.takeRate;
    } else {
      somUSD = (inputs as any).SOM ?? 0;
    }
    const metrics = {
      TAM: inputs.tamUSD,
      SAM: inputs.samUSD,
      SOM: somUSD,
      somPctOfSAM: inputs.samUSD > 0 ? somUSD / inputs.samUSD : 0,
      somPctOfTAM: inputs.tamUSD > 0 ? somUSD / inputs.tamUSD : 0,
      users: inputs.users,
      arpuUSD: inputs.arpuUSD,
      penetrationPct: inputs.penetrationPct,
      takeRate: inputs.takeRate,
      horizon,
    };
    return { somUSD, metrics };
  };

  // Single controller (Total SOM): 3/5/10 with targets 400M / 1B
  const engineConfigMain: SomEngineConfig = {
    baselineInputs: {
      tamUSD: 1.7e12,
      samUSD: 6.76e9,
      users: 2_500_000,
      arpuUSD: 74.8,   // 2.5M * 74.8 ≈ 187M
      takeRate: 1,
      penetrationPct: 1.2,
    },
    calc,
    targetsUSD: { 5: 400e6, 10: 1e9 },
    rounding: { money: 'round', precision: 0 },
    bounds: {
      minSomShareOfSAM: 0, maxSomShareOfSAM: 0,
      minPenetrationPct: 0, maxPenetrationPct: 10,
      minUsers: 0,          maxUsers: 20_000_000,
    },
    tolerancePctOfTarget: 0.005,
  };
  const main = useSomController(engineConfigMain, 3);

  // Non-ride share glidepath (derived from Total)
  const BASE_TOTAL_Y3_USD   = 187e6;
  const BASE_NONRIDE_Y3_USD = 44e6;
  const NONRIDE_SHARE_BY_H: Record<3 | 5 | 10, number> = {
    3: BASE_NONRIDE_Y3_USD / BASE_TOTAL_Y3_USD, // ≈ 0.235
    5: 0.35,
    10: 0.40,
  };

  // Display targets for non-ride deltas only
  const NONRIDE_TARGETS_DISPLAY: Record<5 | 10, number> = { 5: 200e6, 10: 500e6 };

  // TOP chart props (Total)
  const marketUSD = useMemo(() => ({
    TAM: (main.metrics as any)['TAM'] ?? engineConfigMain.baselineInputs.tamUSD,
    TAMYear: 'Global',
    SAM: (main.metrics as any)['SAM'] ?? engineConfigMain.baselineInputs.samUSD,
    SAMYear: '2030 (GVR LATAM Ride-Hailing)',
    SOM: main.som,
  }), [main.metrics, main.som, engineConfigMain.baselineInputs]);

  const users = (main.metrics as any)['users'] as number | undefined;
  const arpuUSD = (main.metrics as any)['arpuUSD'] as number | undefined;

  // Non-ride follows SAME horizon and total
  const share = NONRIDE_SHARE_BY_H[main.horizon];
  const effectiveNonRideSomUSD =
    main.horizon === 3 ? baseSomY3_USD : main.som * share;

  // Rebuild & scale lines for SAME horizon
  const linesResampled = resampleLinesForHorizon(baseLines, main.horizon);
  const effectiveTargetM =
    main.horizon === 3
      ? baseSomY3_M
      : Math.round((effectiveNonRideSomUSD / 1e6) * 100) / 100;

  const linesScaled =
    main.horizon === 3 ? linesResampled : scaleLinesToTarget(linesResampled, baseSomY3_M, effectiveTargetM);

  const nonRideMarketUSD = {
    TAM: 1.7e12,
    TAMYear: 'Selected',
    SAM: 1.0514e11,
    SAMYear: 'Selected',
    SOM: effectiveNonRideSomUSD,
  } as const;

  // Deltas
  const prettyDelta = (delta?: number) => {
    if (typeof delta !== 'number') return '';
    const abs = Math.abs(Math.round(delta));
    const sign = delta > 0 ? 'shortfall' : 'excess';
    return `${sign} ${abs.toLocaleString('en-US')} USD`;
  };
  const pctOfTarget = (target: number, got: number) =>
    target > 0 ? `${Math.round((got / target) * 100)}%` : '—';

  const marketKey  = `total-${main.horizon}-${Math.round(main.som)}`;
  const streamsKey = `nonride-${main.horizon}-${Math.round(effectiveNonRideSomUSD)}`;

  const nonRideDisplayTarget =
    main.horizon === 3 ? baseSomY3_USD : NONRIDE_TARGETS_DISPLAY[main.horizon as 5 | 10];
  const nonRideDisplayDelta = effectiveNonRideSomUSD - nonRideDisplayTarget;

  return (
    <div id="projections" style={{ scrollMarginTop: '96px' }}>
      {/* Top: Total SOM — single CTA link (not pill) + controller */}
      <Section
        kicker="Outlook"
        title="Total SOM • 3 / 5 / 10 years"
        subtitle="Bars show % of TAM (left axis). Line shows total ARR in $M (right axis)."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <small style={{ opacity: 0.75, marginRight: 'auto' }}>
            {main.horizon === 3
              ? 'Baseline (bit-to-bit)'
              : `Target: ${main.horizon === 5 ? '400M' : '1B'} · ${prettyDelta(main.debug.deltaToTargetUSD)} (${pctOfTarget(main.horizon === 5 ? 400e6 : 1e9, main.som)})`}
          </small>

          {/* Single CTA — plain link style (not pill) */}
          <Link
            href={`/investors/methodology?h=${main.horizon}`}
            className="sg-link"
            aria-label="How this is calculated"
            prefetch
          >
            How this is calculated
          </Link>

          {/* Existing segment controller (unchanged) */}
          <ControllerSegment value={main.horizon} onChange={main.setHorizon} />
        </div>

        <MarketChart
          key={marketKey}
          title={`TAM / SAM / TOTAL SOM • ${main.horizon}y`}
          marketScope="custom"
          samMetric="GMV"
          rightAxisLabel="Right: $M (ARR by stream)"
          marketUSD={marketUSD}
          callout={{ somUsersM: users ? Math.round(users / 1e6) : undefined, arpuUSD }}
          rationale={
            main.horizon === 3
              ? 'Baseline preserved exactly; no transformations applied.'
              : (main.debug.limitReason ? `Closest achievable within bounds. ${main.debug.limitReason}` : 'Target matched within rounding tolerance.')
          }
          somScale={1.2}
          showSomScaleNote
        />
      </Section>

      {/* Bottom: Non-ride (NO controller here, NO extra button) */}
      <Section
        id="nonrides"
        kicker="Monetization"
        title="Non-ride revenue streams (subset of total)"
        subtitle="Bars show % of TAM (left axis). Lines show ARR by stream in $M (right axis)."
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <small style={{ opacity: 0.75 }}>
            {main.horizon === 3
              ? 'Baseline (subset of total)'
              : `Target: ${
                  main.horizon === 5 ? `${Math.round(200)}M` : `${Math.round(500)}M`
                } · ${prettyDelta(nonRideDisplayDelta)} (${pctOfTarget(
                  main.horizon === 5 ? 200e6 : 500e6,
                  nonRideMarketUSD.SOM
                )})`}
          </small>
        </div>

        <MarketChartStreams
          key={streamsKey}
          title="Subscriptions • Bookings • Events • B2B2C"
          marketScope="custom"
          samMetric="OperatorRevenue"
          rightAxisLabel="Right: $M (ARR)"
          marketUSD={nonRideMarketUSD}
          lines={linesScaled}
          callout={{ arpuUSD: undefined }}
          somScale={1.0}
          showSomScaleNote={false}
          endLabelMode="outside"
          endLabelWidth={180}
          endLabelMinGap={22}
          liftSamChip
        />
      </Section>
    </div>
  );
}
