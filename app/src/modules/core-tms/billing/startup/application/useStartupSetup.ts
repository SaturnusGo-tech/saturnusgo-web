import { useEffect, useRef, useState } from "react";
import { billingFailure, type BillingFailure } from "../../domain/billing";
import type { StartupSetup, StartupSetupPort, StartupSetupInput } from "../domain/startup-setup";
type Command = { kind: "save"; input: StartupSetupInput; version: number | null; key: string } | { kind: "retry"; version: number; key: string };
type State = { owner: object; setup: StartupSetup | null; loading: boolean; busy: boolean; error: BillingFailure | null; canRetryCommand: boolean };
export function useStartupSetup(port: StartupSetupPort | null, workspaceId: string, enabled: boolean) {
  const ownership = useRef({ port, workspaceId, enabled });
  if (ownership.current.port !== port || ownership.current.workspaceId !== workspaceId || ownership.current.enabled !== enabled) ownership.current = { port, workspaceId, enabled };
  const owner = ownership.current;
  const empty = (): State => ({ owner, setup: null, loading: enabled, busy: false, error: null, canRetryCommand: false });
  const [state, setState] = useState<State>(empty), [revision, refresh] = useState(0);
  const mutation = useRef<AbortController | null>(null), uncertain = useRef<Command | null>(null);
  const owns = () => ownership.current === owner;
  useEffect(() => {
    const controller = new AbortController(); uncertain.current = null;
    setState(value => value.owner === owner ? { ...value, loading: enabled, error: null, canRetryCommand: false } : empty());
    if (port && enabled) void port.read(workspaceId, controller.signal).then(setup => {
      if (!controller.signal.aborted && owns()) setState({ ...empty(), setup, loading: false });
    }, error => { if (!controller.signal.aborted && owns()) setState({ ...empty(), loading: false, error: billingFailure(error) }); });
    else setState({ ...empty(), loading: false });
    return () => { controller.abort(); mutation.current?.abort(); mutation.current = null; uncertain.current = null; };
  }, [owner, revision]);
  const current = state.owner === owner && enabled ? state : { ...empty(), loading: false };
  async function execute(command: Command, replay = false) {
    if (!port || !enabled || !owns() || mutation.current || (!replay && uncertain.current)) return false;
    const controller = new AbortController(); mutation.current = controller;
    setState(value => ({ ...value, busy: true, error: null }));
    try {
      const setup = command.kind === "save" ? await port.save(workspaceId, command.input, command.version, command.key, controller.signal)
        : await port.retry(workspaceId, command.version, command.key, controller.signal);
      if (!controller.signal.aborted && owns()) { uncertain.current = null; setState({ ...empty(), loading: false, setup }); return true; }
    } catch (error) {
      if (!controller.signal.aborted && owns()) { const failure = billingFailure(error); uncertain.current = failure.retryable ? command : null;
        setState(value => ({ ...value, busy: false, error: failure, canRetryCommand: failure.retryable })); }
    } finally { if (mutation.current === controller) mutation.current = null; }
    return false;
  }
  const { owner: _owner, ...visible } = current;
  return { ...visible, reload: () => refresh(value => value + 1),
    save: async (input: StartupSetupInput) => execute({ kind: "save", input, version: current.setup?.version ?? null, key: crypto.randomUUID() }),
    retry: async () => { if (current.setup?.status === "failed") await execute({ kind: "retry", version: current.setup.version, key: crypto.randomUUID() }); },
    retryCommand: async () => { if (uncertain.current) await execute(uncertain.current, true); } };
}
