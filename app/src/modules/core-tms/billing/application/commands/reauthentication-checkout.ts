import type { BillingIntent } from "../../domain/billing";
import type { BillingCommandOptions } from "../../domain/billing-port";
export interface BillingCommand { intent: BillingIntent; options: BillingCommandOptions }
const prefix = "falcon.startup.identity-retry.v1:";
function key(subject: string, workspaceId: string) { return `${prefix}${encodeURIComponent(subject)}:${encodeURIComponent(workspaceId)}`; }
export function storeIdentityCheckout(subject: string | undefined, workspaceId: string, command: BillingCommand | null) {
  if (!subject) return;
  try {
    const name = key(subject, workspaceId);
    if (!command) { sessionStorage.removeItem(name); return; }
    if (command.intent.kind !== "confirm" && (command.intent.kind !== "checkout" || command.intent.planId !== "startup" || !command.intent.startupSetupId)) return;
    sessionStorage.setItem(name, JSON.stringify({ expiresAt: Date.now() + 3_600_000, intent: command.intent,
      options: { idempotencyKey: command.options.idempotencyKey, version: command.options.version } }));
  } catch { /* Storage is optional; the current mounted command still retains its key. */ }
}
export function restoreIdentityCheckout(subject: string | undefined, workspaceId: string): BillingCommand | null {
  if (!subject) return null;
  try {
    const raw = sessionStorage.getItem(key(subject, workspaceId)); if (!raw) return null;
    const value = JSON.parse(raw), intent = value.intent, options = value.options;
    const start = intent?.kind === "checkout" && intent.planId === "startup" && typeof intent.startupSetupId === "string" && !!intent.startupSetupId
      && Number.isSafeInteger(intent.startupSetupVersion) && intent.startupSetupVersion >= 1 && intent.confirmWorkspaceConversion === true;
    const confirm = intent?.kind === "confirm" && typeof intent.checkoutId === "string" && !!intent.checkoutId && ["success", "declined"].includes(intent.outcome);
    if (!Number.isFinite(value.expiresAt) || value.expiresAt <= Date.now() || value.expiresAt > Date.now() + 3_600_000 || (!start && !confirm)
      || typeof options?.idempotencyKey !== "string" || !options.idempotencyKey || options.idempotencyKey.length > 128
      || (options.version !== undefined && (!Number.isSafeInteger(options.version) || options.version < 1))) { storeIdentityCheckout(subject, workspaceId, null); return null; }
    return { intent: confirm ? { kind: "confirm", checkoutId: intent.checkoutId, outcome: intent.outcome }
      : { kind: "checkout", planId: "startup", startupSetupId: intent.startupSetupId, startupSetupVersion: intent.startupSetupVersion, confirmWorkspaceConversion: true },
      options: { idempotencyKey: options.idempotencyKey, version: options.version } };
  } catch { return null; }
}
