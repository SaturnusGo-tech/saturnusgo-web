import type { WaitlistApiResponse, WaitlistPayload } from "../../../../types";

export function isValidWaitlistEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidWaitlistName(name: string): boolean {
  return name.trim().length >= 2;
}

export function buildWaitlistPayload(payload: WaitlistPayload): WaitlistPayload {
  return {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    role: payload.role,
    region: payload.region,
  };
}

export function resolveWaitlistErrorMessage(data: WaitlistApiResponse | null, status: number): string {
  if (Array.isArray(data?.message)) {
    return data.message[0] ?? `HTTP ${status}`;
  }

  return data?.message ?? `HTTP ${status}`;
}
