"use client";
import { useEffect, useRef, useState } from "react";
import type { GoogleLinkPort } from "./google-link-port";
interface State { readonly available: boolean; readonly pending: boolean; readonly error: string | null; readonly destination: string | null }
const initial: State = { available: false, pending: false, error: null, destination: null };
export function useGoogleLink(port: GoogleLinkPort, company: boolean) {
  const [state, setState] = useState(initial);
  const flight = useRef<AbortController | null>(null);
  const pending = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setState(initial);
    if (company) void port.methods(controller.signal).then(methods => {
      if (!controller.signal.aborted) setState(value => ({ ...value, available: methods.google }));
    }).catch(() => { /* An unverified capability never exposes a link action. */ });
    return () => {
      controller.abort(); flight.current?.abort();
      if (pending.current) void port.cancelFederation().catch(() => {});
      pending.current = false;
    };
  }, [port, company]);
  async function link() {
    if (!company || !state.available || pending.current) return;
    const controller = new AbortController(); flight.current = controller; pending.current = true;
    setState(value => ({ ...value, pending: true, error: null }));
    try {
      const result = await port.startGoogle("link", controller.signal);
      const target = new URL(result.authorizationUrl);
      if (target.protocol !== "https:" || target.username || target.password) throw new Error("Invalid provider response");
      if (!controller.signal.aborted) setState(value => ({ ...value, pending: false, destination: target.href }));
    } catch (error) {
      if (!controller.signal.aborted) setState(value => ({ ...value, pending: false,
        error: error && typeof error === "object" && "code" in error ? String(error.code) : "SERVICE_UNAVAILABLE" }));
    } finally { if (flight.current === controller) pending.current = false; }
  }
  return { state, link };
}
