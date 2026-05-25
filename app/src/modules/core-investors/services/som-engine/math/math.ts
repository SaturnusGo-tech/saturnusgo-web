import { RoundingPolicy } from '../types/types';

export function roundMoney(v: number, policy?: RoundingPolicy): number {
  if (!policy) return v;
  const p = Math.max(0, Math.floor(policy.precision));
  const m = Math.pow(10, p);
  if (policy.money === 'ceil') return Math.ceil(v * m) / m;
  if (policy.money === 'floor') return Math.floor(v * m) / m;
  return Math.round(v * m) / m;
}

export function clamp(n: number, min: number, max: number): number {
  if (min > max) [min, max] = [max, min];
  return Math.min(max, Math.max(min, n));
}

export function approxEq(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) <= tol;
}
