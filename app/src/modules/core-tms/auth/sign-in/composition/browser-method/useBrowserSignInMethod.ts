"use client";
import { useEffect, useRef, useState } from "react";
import type { useSignIn } from "../../application/useSignIn";
import { hasBrowserDesktopAttempt } from "../../../continuation/desktop/browser-desktop-attempt";
import { isFalconDesktop } from "../../domain/desktop-mode";

export function useBrowserSignInMethod(signIn: ReturnType<typeof useSignIn>, { managed = false, proof = false } = {}) {
 const [requested] = useState(() => {
  if (typeof window === "undefined") return null;
  const values = new URLSearchParams(window.location.search).getAll("method");
  return values.length === 1 && ["google", "email", "saml"].includes(values[0]) ? values[0] : null;
 });
 const consumed = useRef(false);
 useEffect(() => {
  if (!requested || consumed.current || proof || signIn.state.loading || !signIn.state.methods
    || isFalconDesktop() || !hasBrowserDesktopAttempt()) return;
  consumed.current = true;
  const url = new URL(window.location.href); url.searchParams.delete("method");
  window.history?.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  if (requested === "google") void signIn.google();
  else if (requested === "saml") signIn.select("saml");
  else if (!managed) signIn.select("email");
 }, [requested, signIn, managed, proof]);
}
