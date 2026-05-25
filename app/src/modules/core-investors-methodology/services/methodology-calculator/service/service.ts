'use client';

export type Horizon = '3' | '5' | '10';

type StreamId = 'subs' | 'bookings' | 'events' | 'b2b2c';
export type Stream = {
  id: StreamId;
  label: string;
  y3M: number; // baseline Y3 in $M
};

const BASE_TOTAL_Y3_USD = 187e6;
const BASE_NONRIDE_Y3_M = 32 + 2.8 + 2.8 + 6; // 43.6
const BASE_NONRIDE_Y3_USD = BASE_NONRIDE_Y3_M * 1e6;

const TOTAL_TARGET_USD: Record<Horizon, number> = {
  '3': 187e6,
  '5': 400e6,
  '10': 1e9,
};

const SHARE_BY_H: Record<Horizon, number> = {
  '3': BASE_NONRIDE_Y3_USD / BASE_TOTAL_Y3_USD, // ≈ 0.233
  '5': 0.35,
  '10': 0.40,
};

const BASE_STREAMS: Stream[] = [
  { id: 'subs',     label: 'Subscriptions',        y3M: 32 },
  { id: 'bookings', label: 'Bookings (12%)',       y3M: 2.8 },
  { id: 'events',   label: 'Events (15%)',         y3M: 2.8 },
  { id: 'b2b2c',    label: 'B2B2C (fixed+uplift)', y3M: 6 },
];

export function fmMoney(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
}

export function pct(x: number) {
  return `${Math.round(x * 100)}%`;
}

export type Computed = {
  totalUSD: number;
  nonRideUSD: number;
  rideUSD: number;
  nonRideShare: number;
  rideShare: number;
  nonRidePct: string;
  ridePct: string;
  streamsM: Array<{ id: StreamId; label: string; vM: number }>;
  sumStreamsM: number;
  nonRideM: number;
  deltaStreamsM: number;
};

export function computeMethodology(h: Horizon): Computed {
  const totalUSD = TOTAL_TARGET_USD[h];
  const nonRideUSD = h === '3' ? BASE_NONRIDE_Y3_USD : totalUSD * SHARE_BY_H[h];
  const rideUSD = totalUSD - nonRideUSD;

  const nonRideM = Math.round((nonRideUSD / 1e6) * 10) / 10;
  const k = (nonRideUSD / 1e6) / BASE_NONRIDE_Y3_M;

  const streamsM = BASE_STREAMS.map(s => ({
    id: s.id,
    label: s.label,
    vM: Math.round(s.y3M * k * 10) / 10,
  }));

  const sumStreamsM = Number(streamsM.reduce((a, s) => a + s.vM, 0).toFixed(1));
  const deltaStreamsM = Number((nonRideM - sumStreamsM).toFixed(1));

  const nonRideShare = SHARE_BY_H[h];
  const rideShare = 1 - nonRideShare;

  return {
    totalUSD,
    nonRideUSD,
    rideUSD,
    nonRideShare,
    rideShare,
    nonRidePct: pct(nonRideShare),
    ridePct: pct(rideShare),
    streamsM,
    sumStreamsM,
    nonRideM,
    deltaStreamsM,
  };
}
