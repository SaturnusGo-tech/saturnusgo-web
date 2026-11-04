"use client";
import { useEffect, useRef, useState } from "react";
import type { AccountSpace } from "../domain/account-spaces";
import { spaceRedirect } from "../domain/space-redirect";
import type { SpaceChoicePort } from "./space-choice-port";
interface State { readonly loading: boolean; readonly spaces: readonly AccountSpace[] | null; readonly pending: string | null;
  readonly cancelling: boolean; readonly error: string | null; readonly destination: string | null }
const initial: State = { loading: true, spaces: null, pending: null, cancelling: false, error: null, destination: null };
const code = (error: unknown) => error && typeof error === "object" && "code" in error ? String(error.code) : "SERVICE_UNAVAILABLE";
export function useSpaceChoice(port: SpaceChoicePort, origin: string, suffix = "saturnusgo.com") {
  const [state, setState] = useState(initial);
  const [version, setVersion] = useState(0);
  const flight = useRef<AbortController | null>(null);
  const pending = useRef(false);
  useEffect(() => {
    const controller = new AbortController(); flight.current?.abort(); flight.current = controller; pending.current = false;
    setState(initial);
    void port.list(controller.signal).then(result => {
      if (controller.signal.aborted) return;
      if (!Array.isArray(result.spaces) || result.spaces.length > 256 || new Set(result.spaces.map(space => space.id)).size !== result.spaces.length
        || !result.spaces.every(space => typeof space.id === "string" && space.id.length > 0 && space.id.length <= 128
          && typeof space.name === "string" && !!space.name.trim() && space.name.length <= 200 && (space.kind === "company" || space.kind === "personal"))) throw new Error("Invalid spaces");
      setState({ ...initial, loading: false, spaces: result.spaces });
    }).catch(error => { if (!controller.signal.aborted) setState({ ...initial, loading: false, error: code(error) }); });
    return () => { flight.current?.abort(); pending.current = false; };
  }, [port, version]);
  async function select(id: string) {
    const selected = state.spaces?.find(space => space.id === id);
    if (!selected || pending.current || state.error || state.loading) return;
    flight.current?.abort(); const controller = new AbortController(); flight.current = controller; pending.current = true;
    setState(value => ({ ...value, pending: id, error: null }));
    try {
      const result = await port.select(id, controller.signal);
      const destination = spaceRedirect(result.redirectUrl, origin, selected.kind, suffix);
      if (!destination) throw Object.assign(new Error("Invalid redirect"), { code: "INVALID_RESPONSE" });
      if (!controller.signal.aborted) setState(value => ({ ...value, pending: null, destination }));
    } catch (error) { if (!controller.signal.aborted) setState({ ...initial, loading: false, error: code(error) }); }
    finally { if (flight.current === controller) pending.current = false; }
  }
  async function cancel() {
    flight.current?.abort(); const controller = new AbortController(); flight.current = controller; pending.current = true;
    setState({ ...initial, loading: false, cancelling: true });
    try { await port.cancel(controller.signal); } catch { /* Returning to methods never grants access if proof cancellation cannot reach the server. */ }
    if (!controller.signal.aborted) setState({ ...initial, loading: false, destination: "/cloud-login/" });
    if (flight.current === controller) pending.current = false;
  }
  return { state, select, cancel, retry: () => setVersion(value => value + 1) };
}
