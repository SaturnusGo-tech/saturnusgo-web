import { useEffect, useMemo, useRef, useState } from "react";
import type { BillingCommand } from "../../application/commands/reauthentication-checkout";
import type { BillingCheckout } from "../../domain/billing";
import type { StartupSetupPort } from "../domain/startup-setup";

export function useStartupCheckoutRecovery({ port, workspaceId, command, checkout, enabled, resume }: {
  port: StartupSetupPort | null; workspaceId: string; command: BillingCommand | null; checkout: BillingCheckout | null;
  enabled: boolean; resume(): Promise<void>;
}) {
  const owner = useMemo(() => ({ port, workspaceId, command, checkout, enabled }), [port, workspaceId, command, checkout, enabled]);
  const [finished, setFinished] = useState<object | null>(null);
  const current = useRef(owner), action = useRef(resume); current.current = owner; action.current = resume;
  const eligible = !!command && enabled && !!port && (command.intent.kind === "checkout" && command.intent.planId === "startup"
    || command.intent.kind === "confirm" && checkout?.workspaceId === workspaceId && checkout.planId === "startup" && checkout.status === "open" && checkout.id === command.intent.checkoutId);
  useEffect(() => {
    const controller = new AbortController();
    if (!eligible || !port || !command) return () => controller.abort();
    void port.read(workspaceId, controller.signal).then(async setup => {
      if (controller.signal.aborted || current.current !== owner) return;
      const intent = command.intent;
      const ready = setup?.status === "ready" && Date.parse(setup.expiresAt) > Date.now();
      const samePreparation = intent.kind === "confirm" || intent.kind === "checkout" && setup?.id === intent.startupSetupId && setup?.version === intent.startupSetupVersion && intent.confirmWorkspaceConversion === true;
      if (ready && samePreparation) await action.current();
    }).catch(() => { /* Leave the saved action available for an explicit retry after an interrupted read. */ })
      .finally(() => { if (!controller.signal.aborted && current.current === owner) setFinished(owner); });
    return () => controller.abort();
  }, [owner, eligible]);
  return { checking: eligible && finished !== owner };
}
