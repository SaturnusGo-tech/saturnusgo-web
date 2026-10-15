export type DemoLocale = "ru" | "en" | "es" | "pt";
export type DemoFailure = "invalid" | "rate" | "unavailable";
export const DEMO_CONSENT_VERSION = "2026-10-15";
export type DemoRequest = { email: string; locale: DemoLocale; consent: boolean; website: string };

export class DemoRequestError extends Error {
  constructor(public readonly kind: DemoFailure) { super(kind); this.name = "DemoRequestError"; }
}

export function validateDemoEmail(value: string): boolean {
  const email = value.trim();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
  const [local, domain] = email.split("@");
  return local.length <= 64 && !local.startsWith(".") && !local.endsWith(".") && !local.includes("..") &&
    domain.split(".").every(label => label.length > 0 && label.length <= 63 && !label.startsWith("-") && !label.endsWith("-"));
}

export async function requestDemo(input: DemoRequest, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<void> {
  if (!input.consent || !validateDemoEmail(input.email)) throw new DemoRequestError("invalid");
  const response = await fetcher("/api/falcon-demo/request", {
    method: "POST", credentials: "same-origin", signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...input, email: input.email.trim(), consentVersion: DEMO_CONSENT_VERSION }),
  });
  if (!response.ok) throw new DemoRequestError(response.status === 429 ? "rate" : response.status === 400 ? "invalid" : "unavailable");
  const result: unknown = await response.json().catch(() => null);
  if (!result || typeof result !== "object" || !("status" in result) || result.status !== "accepted") {
    throw new DemoRequestError("unavailable");
  }
}
