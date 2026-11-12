export function retryAfterSeconds(value: string | null): number | null {
  if (!value || value.length > 128) return null;
  const seconds = /^\d+$/.test(value) ? Number(value) : (Date.parse(value) - Date.now()) / 1000;
  return Number.isFinite(seconds) ? Math.min(86_400, Math.max(1, Math.ceil(seconds))) : null;
}
