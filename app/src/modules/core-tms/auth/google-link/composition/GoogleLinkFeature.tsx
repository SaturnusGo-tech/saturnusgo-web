"use client";
import { useEffect, useMemo, useState } from "react";
import { createSignInClient } from "../../sign-in/data/sign-in-client";
import { useGoogleLink } from "../application/useGoogleLink";
import { GoogleLinkAction } from "../presentation/GoogleLinkAction";
export function GoogleLinkFeature({ company }: { readonly company: boolean }) {
  const port = useMemo(() => createSignInClient(), []);
  const model = useGoogleLink(port, company);
  const [desktop, setDesktop] = useState(false);
  useEffect(() => { setDesktop(/(?:^|\s)FalconDesktop\/\d+\.\d+\.\d+(?:\s|$)/.test(navigator.userAgent)); }, []);
  useEffect(() => {
    if (model.state.destination) window.location.assign(model.state.destination);
  }, [model.state.destination]);
  return company ? <GoogleLinkAction model={model} desktop={desktop} /> : null;
}
